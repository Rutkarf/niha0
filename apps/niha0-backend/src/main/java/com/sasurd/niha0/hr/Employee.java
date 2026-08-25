package com.sasurd.niha0.hr;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Getter
@Setter
public class Employee extends TenantEntity {

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    private String email;

    @Column(name = "job_title")
    private String jobTitle;

    private String department;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "hired_at")
    private LocalDate hiredAt;
}
