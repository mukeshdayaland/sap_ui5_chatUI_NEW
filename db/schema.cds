namespace sap.ui5.chat;

entity AuditEvents {
  key ID : UUID;
  createdAt : Timestamp;
  correlationId : String(64);
  intent : String(80);
  status : String(20);
}
