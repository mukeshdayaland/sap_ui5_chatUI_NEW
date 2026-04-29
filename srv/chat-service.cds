service ChatService {
  function health() returns {
    status: String;
    service: String;
  };
}
