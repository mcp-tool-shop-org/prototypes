namespace PocketLedger.Application.Validation;

public class ValidationResult
{
    private readonly List<ValidationError> _errors = new();

    public bool IsValid => _errors.Count == 0;
    public IReadOnlyList<ValidationError> Errors => _errors.AsReadOnly();

    public void AddError(string propertyName, string message)
    {
        _errors.Add(new ValidationError(propertyName, message));
    }

    public void AddError(string message)
    {
        _errors.Add(new ValidationError(string.Empty, message));
    }

    public string GetErrorMessage()
    {
        if (IsValid)
            return string.Empty;

        return string.Join("; ", _errors.Select(e =>
            string.IsNullOrEmpty(e.PropertyName)
                ? e.Message
                : $"{e.PropertyName}: {e.Message}"));
    }

    public static ValidationResult Success() => new();

    public static ValidationResult Failure(string propertyName, string message)
    {
        var result = new ValidationResult();
        result.AddError(propertyName, message);
        return result;
    }

    public static ValidationResult Failure(string message)
    {
        var result = new ValidationResult();
        result.AddError(message);
        return result;
    }
}

public record ValidationError(string PropertyName, string Message);
