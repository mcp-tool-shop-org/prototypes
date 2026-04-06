using Microsoft.Extensions.DependencyInjection;
using PocketLedger.Application.DTOs;
using PocketLedger.Application.Validation;

namespace PocketLedger.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateAccountDto>, CreateAccountValidator>();
        services.AddScoped<IValidator<CreateTransactionDto>, CreateTransactionValidator>();
        services.AddScoped<IValidator<CreateEnvelopeDto>, CreateEnvelopeValidator>();
        services.AddScoped<IValidator<CreateGoalDto>, CreateGoalValidator>();
        services.AddScoped<IValidator<CreateCategoryDto>, CreateCategoryValidator>();

        return services;
    }
}
