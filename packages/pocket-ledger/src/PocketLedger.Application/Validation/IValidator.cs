using PocketLedger.Application.Common;

namespace PocketLedger.Application.Validation;

public interface IValidator<in T>
{
    Result Validate(T instance);
}
