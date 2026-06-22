class Strike {
  final int id;
  final int volunteerId;
  final String volunteerName;
  final String reason;
  final String severity;
  final int? eventId;
  final String? eventName;
  final bool isActive;
  final bool isAppealed;
  final DateTime issuedAt;
  final int issuedById;
  final String issuedByName;
  final DateTime? removedAt;
  final String? appealStatus;

  Strike({
    required this.id,
    required this.volunteerId,
    required this.volunteerName,
    required this.reason,
    required this.severity,
    this.eventId,
    this.eventName,
    required this.isActive,
    required this.isAppealed,
    required this.issuedAt,
    required this.issuedById,
    required this.issuedByName,
    this.removedAt,
    this.appealStatus,
  });

  factory Strike.fromJson(Map<String, dynamic> json) {
    return Strike(
      id: (json['id'] as num).toInt(),
      volunteerId: (json['volunteerId'] as num).toInt(),
      volunteerName: json['volunteerName'] as String? ?? '',
      reason: json['reason'] as String? ?? '',
      severity: json['severity'] as String? ?? 'LOW',
      eventId: (json['eventId'] as num?)?.toInt(),
      eventName: json['eventName'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      isAppealed: json['isAppealed'] as bool? ?? false,
      issuedAt: json['issuedAt'] != null
          ? DateTime.parse(json['issuedAt'] as String)
          : DateTime.now(),
      issuedById: (json['issuedById'] as num?)?.toInt() ?? 0,
      issuedByName: json['issuedByName'] as String? ?? '',
      removedAt: json['removedAt'] != null
          ? DateTime.parse(json['removedAt'] as String)
          : null,
      appealStatus: json['appealStatus'] as String?,
    );
  }

  String get severityDisplay {
    switch (severity) {
      case 'LOW':
        return 'Лёгкий';
      case 'MEDIUM':
        return 'Средний';
      case 'HIGH':
        return 'Серьёзный';
      case 'CRITICAL':
        return 'Критический';
      default:
        return severity;
    }
  }
}

class Appeal {
  final int id;
  final int strikeId;
  final int volunteerId;
  final String volunteerName;
  final String reason;
  final String status;
  final String? hrComment;
  final DateTime? reviewedAt;
  final int? reviewedById;
  final String? reviewedByName;
  final DateTime createdAt;

  Appeal({
    required this.id,
    required this.strikeId,
    required this.volunteerId,
    required this.volunteerName,
    required this.reason,
    required this.status,
    this.hrComment,
    this.reviewedAt,
    this.reviewedById,
    this.reviewedByName,
    required this.createdAt,
  });

  factory Appeal.fromJson(Map<String, dynamic> json) {
    return Appeal(
      id: (json['id'] as num).toInt(),
      strikeId: (json['strikeId'] as num).toInt(),
      volunteerId: (json['volunteerId'] as num).toInt(),
      volunteerName: json['volunteerName'] as String? ?? '',
      reason: json['reason'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      hrComment: json['hrComment'] as String?,
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.parse(json['reviewedAt'] as String)
          : null,
      reviewedById: (json['reviewedById'] as num?)?.toInt(),
      reviewedByName: json['reviewedByName'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  String get statusDisplay {
    switch (status) {
      case 'PENDING':
        return 'На рассмотрении';
      case 'APPROVED':
        return 'Одобрена';
      case 'REJECTED':
        return 'Отклонена';
      default:
        return status;
    }
  }
}

class RatingEntry {
  final int id;
  final String? uniqueId;
  final String firstName;
  final String lastName;
  final String role;
  final String status;
  final double totalHours;
  final int strikeCount;

  RatingEntry({
    required this.id,
    this.uniqueId,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.status,
    required this.totalHours,
    required this.strikeCount,
  });

  factory RatingEntry.fromJson(Map<String, dynamic> json) {
    return RatingEntry(
      id: (json['id'] as num).toInt(),
      uniqueId: json['uniqueId'] as String?,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      role: json['role'] as String? ?? 'VOLUNTEER',
      status: json['status'] as String? ?? '',
      totalHours: (json['totalHours'] as num?)?.toDouble() ?? 0.0,
      strikeCount: (json['strikeCount'] as num?)?.toInt() ?? 0,
    );
  }

  String get fullName => '$firstName $lastName';
}
