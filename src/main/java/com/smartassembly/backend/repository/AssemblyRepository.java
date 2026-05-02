package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.Assembly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssemblyRepository extends JpaRepository<Assembly, Long> {
    List<Assembly> findByIsActiveTrue();
    Optional<Assembly> findByCity(String city);
}