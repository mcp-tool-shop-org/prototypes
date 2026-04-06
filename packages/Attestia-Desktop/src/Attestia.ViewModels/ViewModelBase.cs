using CommunityToolkit.Mvvm.ComponentModel;
using Attestia.Core.Models;

namespace Attestia.ViewModels;

public abstract partial class ViewModelBase : ObservableObject
{
    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string? _errorMessage;

    [ObservableProperty]
    private bool _isEngineOffline;

    protected void ClearError()
    {
        ErrorMessage = null;
        IsEngineOffline = false;
    }

    protected void SetError(string message) => ErrorMessage = message;

    protected async Task RunBusyAsync(Func<Task> action)
    {
        if (IsBusy) return;

        try
        {
            IsBusy = true;
            ClearError();
            await action();
        }
        catch (Exception ex)
        {
            SetError(HumanizeError(ex));
        }
        finally
        {
            IsBusy = false;
        }
    }

    protected async Task<T?> RunBusyAsync<T>(Func<Task<T>> action)
    {
        if (IsBusy) return default;

        try
        {
            IsBusy = true;
            ClearError();
            return await action();
        }
        catch (Exception ex)
        {
            SetError(HumanizeError(ex));
            return default;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private string HumanizeError(Exception ex)
    {
        if (ex is HttpRequestException or TaskCanceledException)
        {
            IsEngineOffline = true;
            return "Unable to reach the attestation engine. Check that the sidecar is running.";
        }

        if (ex is AttestiaException attestia)
            return attestia.Message;

        if (ex.Message.Contains("Connection refused") || ex.Message.Contains("No connection"))
        {
            IsEngineOffline = true;
            return "The attestation engine is not responding.";
        }

        return ex.Message;
    }
}
