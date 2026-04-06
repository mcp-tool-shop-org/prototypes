namespace PocketLedger.Application.Exceptions;

public class ApplicationException : Exception
{
    public string Code { get; }

    public ApplicationException(string message, string code = "APPLICATION_ERROR")
        : base(message)
    {
        Code = code;
    }

    public ApplicationException(string message, Exception innerException, string code = "APPLICATION_ERROR")
        : base(message, innerException)
    {
        Code = code;
    }
}

public class ValidationException : ApplicationException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred", "VALIDATION_ERROR")
    {
        Errors = new Dictionary<string, string[]>(errors);
    }

    public ValidationException(string propertyName, string errorMessage)
        : base($"Validation error: {errorMessage}", "VALIDATION_ERROR")
    {
        Errors = new Dictionary<string, string[]>
        {
            { propertyName, new[] { errorMessage } }
        };
    }
}

public class UnauthorizedAccessException : ApplicationException
{
    public string Resource { get; }
    public string? Action { get; }

    public UnauthorizedAccessException(string resource, string? action = null)
        : base($"Access denied to {resource}" + (action != null ? $" for action '{action}'" : ""), "UNAUTHORIZED")
    {
        Resource = resource;
        Action = action;
    }
}

public class ConflictException : ApplicationException
{
    public string Resource { get; }

    public ConflictException(string resource, string message)
        : base(message, "CONFLICT")
    {
        Resource = resource;
    }
}

public class ServiceUnavailableException : ApplicationException
{
    public string ServiceName { get; }

    public ServiceUnavailableException(string serviceName, string? details = null)
        : base($"Service '{serviceName}' is unavailable" + (details != null ? $": {details}" : ""), "SERVICE_UNAVAILABLE")
    {
        ServiceName = serviceName;
    }
}
