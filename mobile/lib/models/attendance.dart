class Attendance {
  final int id;
  final int eventId;
  final int volunteerId;
  final String status;
  final int? hoursWorked;
  final String? notes;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Attendance({
    required this.id,
    required this.eventId,
    required this.volunteerId,
    required this.status,
    this.hoursWorked,
    this.notes,
    required this.createdAt,
    this.updatedAt,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'] as int,
      eventId: json['eventId'] as int,
      volunteerId: json['volunteerId'] as int,
      status: (json['status'] as String).toUpperCase(),
      hoursWorked: json['hoursWorked'] as int?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  String get statusDisplay {
    switch (status) {
      case 'INTERESTED':
        return 'Заинтересован';
      case 'ATTENDING':
        return 'Участвует';
      case 'COMPLETED':
        return 'Завершено';
      case 'CANCELLED':
        return 'Отменено';
      default:
        return status;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventId': eventId,
      'volunteerId': volunteerId,
      'status': status,
      'hoursWorked': hoursWorked,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
