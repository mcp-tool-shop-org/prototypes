export interface SignOptions {
  keyless?: boolean;
  keyPath?: string;
  embed?: boolean;
}

export interface SignResult {
  digest: string;
  signature: string;
  certificate?: string;
  signedBy?: string;
  signedAt: string;
  rekorLogId?: string;
  sidecarPaths?: {
    signature: string;
    certificate?: string;
  };
}

export interface VerifySignatureOptions {
  keyPath?: string;
  certificateIdentity?: string;
  certificateOidcIssuer?: string;
}
