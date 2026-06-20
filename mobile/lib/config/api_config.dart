class ApiConfig {
  static const String baseUrl = 'http://109.235.117.121:8080';

  static const String loginEndpoint = '/api/auth/send-code';
  static const String verifyOtpEndpoint = '/api/auth/verify-code';
  static const String meEndpoint = '/api/users/me';
  static const String eventsEndpoint = '/api/events';
  static const String attendanceEndpoint = '/api/attendance';

  static String getFullUrl(String endpoint) => '$baseUrl$endpoint';
}
