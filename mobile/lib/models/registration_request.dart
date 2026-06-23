class RegistrationRequest {
  final int id;
  final String firstName;
  final String? middleName;
  final String lastName;
  final String phone;
  final String email;
  final String? instagram;
  final String? assemblyName;
  final String? photoUrl;
  final DateTime? birthDate;
  final String? iin;
  final String? studyPlace;
  final String? workPlace;
  final String? freeDays;
  final String? languages;
  final String? volunteeringExperience;
  final String? hobbies;
  final String? interestedEvents;
  final String? discoverySource;
  final String? motivation;
  final String status;
  final String? hrComment;
  final DateTime? createdAt;
  final DateTime? reviewedAt;

  RegistrationRequest({
    required this.id,
    required this.firstName,
    this.middleName,
    required this.lastName,
    required this.phone,
    required this.email,
    this.instagram,
    this.assemblyName,
    this.photoUrl,
    this.birthDate,
    this.iin,
    this.studyPlace,
    this.workPlace,
    this.freeDays,
    this.languages,
    this.volunteeringExperience,
    this.hobbies,
    this.interestedEvents,
    this.discoverySource,
    this.motivation,
    required this.status,
    this.hrComment,
    this.createdAt,
    this.reviewedAt,
  });

  factory RegistrationRequest.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic v) {
      if (v == null) return null;
      try {
        return DateTime.parse(v as String);
      } catch (_) {
        return null;
      }
    }

    return RegistrationRequest(
      id: (json['id'] as num).toInt(),
      firstName: json['firstName'] as String? ?? '',
      middleName: json['middleName'] as String?,
      lastName: json['lastName'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String? ?? '',
      instagram: json['instagram'] as String?,
      assemblyName: json['assemblyName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      birthDate: parseDate(json['birthDate']),
      iin: json['iin'] as String?,
      studyPlace: json['studyPlace'] as String?,
      workPlace: json['workPlace'] as String?,
      freeDays: json['freeDays'] as String?,
      languages: json['languages'] as String?,
      volunteeringExperience: json['volunteeringExperience'] as String?,
      hobbies: json['hobbies'] as String?,
      interestedEvents: json['interestedEvents'] as String?,
      discoverySource: json['discoverySource'] as String?,
      motivation: json['motivation'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      hrComment: json['hrComment'] as String?,
      createdAt: parseDate(json['createdAt']),
      reviewedAt: parseDate(json['reviewedAt']),
    );
  }

  String get fullName =>
      [lastName, firstName, middleName].where((s) => s != null && s.isNotEmpty).join(' ');

  String get initials {
    final f = firstName.isNotEmpty ? firstName[0] : '';
    final l = lastName.isNotEmpty ? lastName[0] : '';
    return (f + l).toUpperCase();
  }

  String get statusDisplay {
    switch (status) {
      case 'PENDING':
        return 'Ожидает';
      case 'APPROVED':
        return 'Принята';
      case 'REJECTED':
        return 'Отклонена';
      default:
        return status;
    }
  }
}
