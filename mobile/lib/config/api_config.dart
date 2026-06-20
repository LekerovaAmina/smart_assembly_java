class ApiConfig {
  static const String baseUrl = 'http://localhost:8080';

  static const String loginEndpoint = '/api/auth/send-otp';
  static const String verifyOtpEndpoint = '/api/auth/verify-otp';
  static const String meEndpoint = '/api/users/me';
  static const String eventsEndpoint = '/api/events';
  static const String attendanceEndpoint = '/api/attendance';

  static String getFullUrl(String endpoint) => '$baseUrl$endpoint';
}
