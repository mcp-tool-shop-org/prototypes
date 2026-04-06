namespace Attestia.Client;

public sealed class AttestiaClient
{
    public IntentsClient Intents { get; }
    public VerifyClient Verify { get; }
    public ProofsClient Proofs { get; }
    public ReconciliationClient Reconciliation { get; }
    public ComplianceClient Compliance { get; }
    public EventsClient Events { get; }
    public ExportClient Export { get; }
    public PublicClient Public { get; }

    public AttestiaClient(AttestiaHttpClient http)
    {
        Intents = new IntentsClient(http);
        Verify = new VerifyClient(http);
        Proofs = new ProofsClient(http);
        Reconciliation = new ReconciliationClient(http);
        Compliance = new ComplianceClient(http);
        Events = new EventsClient(http);
        Export = new ExportClient(http);
        Public = new PublicClient(http);
    }
}
