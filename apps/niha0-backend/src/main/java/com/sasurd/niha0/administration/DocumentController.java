package com.sasurd.niha0.administration;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/administration/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public List<Document> list() {
        return documentService.listDocuments();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','MEMBER')")
    public Document create(@RequestBody Document document) {
        return documentService.createDocument(document);
    }

    @GetMapping("/{id}")
    public Document get(@PathVariable UUID id) {
        return documentService.getDocument(id);
    }
}
