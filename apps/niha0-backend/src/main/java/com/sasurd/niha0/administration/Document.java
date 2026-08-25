package com.sasurd.niha0.administration;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "documents")
@Getter
@Setter
public class Document extends TenantEntity {

    @Column(nullable = false)
    private String title;

    private String category;

    @Column(nullable = false)
    private String status = "DRAFT";

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "due_date")
    private LocalDate dueDate;
}
