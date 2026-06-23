class User {
  final int id;
  final String uniqueId;
  final String firstName;
  final String lastName;
  final String phone;
  final String email;
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
    required this.email,
    required this.role,
    required this.status,
    required this.totalHours,
    required this.strikeCount,
    this.departmentId,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] as num).toInt(),
      uniqueId: json['uniqueId'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'VOLUNTEER',
      status: json['status'] as String? ?? 'ACTIVE',
      totalHours: (json['totalHours'] as num?)?.toInt() ?? 0,
      strikeCount: (json['strikeCount'] as num?)?.toInt() ?? 0,
      departmentId: (json['departmentId'] as num?)?.toInt(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  String get fullName => '$firstName $lastName';

  String get statusDisplay {
    switch (status) {
      case 'ACTIVE':
        return 'Активен';
      case 'VOLUNTEER':
        return 'Волонтёр';
      case 'INACTIVE':
        return 'Неактивен';
      case 'BANNED':
        return 'Заблокирован';
      case 'MEMBER':
        return 'Участник';
      case 'BOARD_MEMBER':
        return 'Член совета';
      case 'ECO_YOUTH':
        return 'Эко молодёжь';
      case 'LEFT':
        return 'Выбыл';
      case 'REMOTE':
        return 'Дистанционно';
      default:
        return status;
    }
  }

  String get roleDisplay {
    switch (role) {
      case 'HR':
        return 'HR';
      case 'ADMIN':
        return 'Администратор';
      case 'SUPER_ADMIN':
        return 'Супер-администратор';
      case 'COORDINATOR':
        return 'Координатор';
      case 'VOLUNTEER':
        return 'Волонтёр';
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
      'email': email,
      'role': role,
      'status': status,
      'totalHours': totalHours,
      'strikeCount': strikeCount,
      'departmentId': departmentId,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
