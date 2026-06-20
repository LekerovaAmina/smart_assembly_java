class User {
  final int id;
  final String uniqueId;
  final String firstName;
  final String lastName;
  final String phone;
  final String role;
  final String status;
  final int totalHours;
  final int strikeCount;
  final int? departmentId;
  final DateTime createdAt;

  User({
    required this.id,
    required this.uniqueId,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.role,
    required this.status,
    required this.totalHours,
    required this.strikeCount,
    this.departmentId,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      uniqueId: json['uniqueId'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      phone: json['phone'] as String,
      role: json['role'] as String,
      status: json['status'] as String,
      totalHours: json['totalHours'] as int,
      strikeCount: json['strikeCount'] as int,
      departmentId: json['departmentId'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  String get fullName => '$firstName $lastName';

  String get roleDisplay {
    switch (role) {
      case 'ADMIN':
        return 'Администратор';
      case 'COORDINATOR':
        return 'Координатор';
      case 'VOLUNTEER':
        return 'Волонтер';
      default:
        return role;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'uniqueId': uniqueId,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'role': role,
      'status': status,
      'totalHours': totalHours,
      'strikeCount': strikeCount,
      'departmentId': departmentId,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
