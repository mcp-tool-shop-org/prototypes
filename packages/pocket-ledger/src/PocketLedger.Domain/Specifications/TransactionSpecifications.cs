using System.Linq.Expressions;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Specifications;

public class TransactionByAccountSpec : Specification<Transaction>
{
    private readonly Guid _accountId;

    public TransactionByAccountSpec(Guid accountId)
    {
        _accountId = accountId;
    }

    public override Expression<Func<Transaction, bool>> ToExpression()
    {
        return t => t.AccountId == _accountId || t.TransferToAccountId == _accountId;
    }
}

public class TransactionByDateRangeSpec : Specification<Transaction>
{
    private readonly DateRange _range;

    public TransactionByDateRangeSpec(DateRange range)
    {
        _range = range;
    }

    public override Expression<Func<Transaction, bool>> ToExpression()
    {
        return t => t.Date >= _range.StartDate && t.Date <= _range.EndDate;
    }
}

public class TransactionByCategorySpec : Specification<Transaction>
{
    private readonly Guid _categoryId;

    public TransactionByCategorySpec(Guid categoryId)
    {
        _categoryId = categoryId;
    }

    public override Expression<Func<Transaction, bool>> ToExpression()
    {
        return t => t.CategoryId == _categoryId;
    }
}

public class TransactionByTypeSpec : Specification<Transaction>
{
    private readonly TransactionType _type;

    public TransactionByTypeSpec(TransactionType type)
    {
        _type = type;
    }

    public override Expression<Func<Transaction, bool>> ToExpression()
    {
        return t => t.Type == _type;
    }
}

public class UnclearedTransactionSpec : Specification<Transaction>
{
    public override Expression<Func<Transaction, bool>> ToExpression()
    {
        return t => !t.IsCleared;
    }
}

public class ExpenseTransactionSpec : Specification<Transaction>
{
    public override Expression<Func<Transaction, bool>> ToExpression()
    {
        return t => t.Type == TransactionType.Expense;
    }
}

public class IncomeTransactionSpec : Specification<Transaction>
{
    public override Expression<Func<Transaction, bool>> ToExpression()
    {
        return t => t.Type == TransactionType.Income;
    }
}
