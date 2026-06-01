package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    Optional<User> findByIin(String iin);

    Optional<User> findByUniqueId(String uniqueId);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByIin(String iin);

    // Все активные пользователи отделения
    List<User> findByAssemblyIdAndIsActiveTrue(Long assemblyId);

    // Пользователи по роли в отделении
    List<User> findByAssemblyIdAndRole(Long assemblyId, UserRole role);

    // Рейтинг — топ по часам за месяц в отделении
    @Query("SELECT u FROM User u WHERE u.assembly.id = :assemblyId AND u.isActive = true " +
            "ORDER BY u.monthlyVolunteerHours DESC")
    List<User> findTopByMonthlyHours(Long assemblyId);

    // Рейтинг — топ по всем часам в отделении
    @Query("SELECT u FROM User u WHERE u.assembly.id = :assemblyId AND u.isActive = true " +
            "ORDER BY u.totalVolunteerHours DESC")
    List<User> findTopByTotalHours(Long assemblyId);

    // Пользователи с активными страйками >= maxStrikes
    List<User> findByActiveStrikesGreaterThanEqual(Integer strikes);
}