namespace PocketLedger.Domain.Exceptions;

public class DomainException : Exception
{
    public string Code { get; }

    public DomainException(string message, string code = "DOMAIN_ERROR")
        : base(message)
    {
        Code = code;
    }

    public DomainException(string message, Exception innerException, string code = "DOMAIN_ERROR")
        : base(message, innerException)
    {
        Code = code;
    }
}

public class EntityNotFoundException : DomainException
{
    public string EntityType { get; }
    public Guid EntityId { get; }

    public EntityNotFoundException(string entityType, Guid entityId)
        : base($"{entityType} with ID {entityId} was not found", "ENTITY_NOT_FOUND")
    {
        EntityType = entityType;
        EntityId = entityId;
    }
}

public class DuplicateEntityException : DomainException
{
    public string EntityType { get; }
    public string DuplicateField { get; }

    public DuplicateEntityException(string entityType, string duplicateField, string value)
        : base($"{entityType} with {duplicateField} '{value}' already exists", "DUPLICATE_ENTITY")
    {
        EntityType = entityType;
        DuplicateField = duplicateField;
    }
}

public class BusinessRuleViolationException : DomainException
{
    public string RuleName { get; }

    public BusinessRuleViolationException(string ruleName, string message)
        : base(message, "BUSINESS_RULE_VIOLATION")
    {
        RuleName = ruleName;
    }
}

public class InsufficientFundsException : DomainException
{
    public decimal Available { get; }
    public decimal Required { get; }

    public InsufficientFundsException(decimal available, decimal required)
        : base($"Insufficient funds. Available: {available:C}, Required: {required:C}", "INSUFFICIENT_FUNDS")
    {
        Available = available;
        Required = required;
    }
}

public class InvalidOperationDomainException : DomainException
{
    public string Operation { get; }

    public InvalidOperationDomainException(string operation, string reason)
        : base($"Cannot perform '{operation}': {reason}", "INVALID_OPERATION")
    {
        Operation = operation;
    }
}
