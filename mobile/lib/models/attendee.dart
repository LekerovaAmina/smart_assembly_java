class Attendee {
  final int userId;
  final String name;
  final String? phone;
  final String? uniqueId;
  final String status;
  final String? checkInTime;
  final String? earlyLeaveTime;
  final double extraHours;
  final String? hoursNote;
  final double? calculatedHours;

  Attendee({
    required this.userId,
    required this.name,
    this.phone,
    this.uniqueId,
    required this.status,
    this.checkInTime,
    this.earlyLeaveTime,
    this.extraHours = 0,
    this.hoursNote,
    this.calculatedHours,
  });

  factory Attendee.fromJson(Map<String, dynamic> json) {
    return Attendee(
      userId: json['userId'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String?,
      uniqueId: json['uniqueId'] as String?,
      status: json['status'] as String? ?? 'REGISTERED',
      checkInTime: json['checkInTime'] as String?,
      earlyLeaveTime: json['earlyLeaveTime'] as String?,
      extraHours: (json['extraHours'] as num?)?.toDouble() ?? 0,
      hoursNote: json['hoursNote'] as String?,
      calculatedHours: (json['calculatedHours'] as num?)?.toDouble(),
    );
  }

  String get statusDisplay {
    switch (status) {
      case 'ATTENDED':
        return 'Пришёл';
      case 'REGISTERED':
        return 'Записан';
      case 'CONFIRMED':
        return 'Подтверждён';
      default:
        return status;
    }
  }
}
