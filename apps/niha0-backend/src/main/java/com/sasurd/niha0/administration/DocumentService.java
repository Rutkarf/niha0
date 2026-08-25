package com.sasurd.niha0.administration;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;

    public DocumentService(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @Transactional(readOnly = true)
    public List<Document> listDocuments() {
        return documentRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Document createDocument(Document document) {
        document.setOrganizationId(orgId());
        return documentRepository.save(document);
    }

    @Transactional(readOnly = true)
    public Document getDocument(UUID id) {
        return documentRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Document not found"));
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
