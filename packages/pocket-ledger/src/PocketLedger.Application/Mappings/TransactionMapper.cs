using PocketLedger.Application.DTOs;
using PocketLedger.Domain.Entities;

namespace PocketLedger.Application.Mappings;

public static class TransactionMapper
{
    public static TransactionDto ToDto(
        this Transaction transaction,
        string? accountName = null,
        string? categoryName = null,
        string? transferToAccountName = null)
    {
        return new TransactionDto(
            Id: transaction.Id,
            Date: transaction.Date,
            Amount: transaction.Amount.Amount,
            CurrencyCode: transaction.Amount.CurrencyCode,
            Type: transaction.Type,
            Description: transaction.Description,
            Notes: transaction.Notes,
            AccountId: transaction.AccountId,
            AccountName: accountName,
            CategoryId: transaction.CategoryId,
            CategoryName: categoryName,
            TransferToAccountId: transaction.TransferToAccountId,
            TransferToAccountName: transferToAccountName,
            RecurringTransactionId: transaction.RecurringTransactionId,
            IsCleared: transaction.IsCleared,
            CreatedAt: transaction.CreatedAt,
            UpdatedAt: transaction.UpdatedAt);
    }
}
