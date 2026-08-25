package com.sasurd.niha0.organization;

import com.sasurd.niha0.organization.dto.CompanyDataAssetRequest;
import com.sasurd.niha0.organization.dto.CompanyDataAssetResponse;
import com.sasurd.niha0.organization.dto.CreateInviteRequest;
import com.sasurd.niha0.organization.dto.InviteResponse;
import com.sasurd.niha0.organization.dto.MembershipResponse;
import com.sasurd.niha0.organization.dto.OrganizationResponse;
import com.sasurd.niha0.organization.dto.OrganizationUpdateRequest;
import com.sasurd.niha0.organization.dto.UpdateMemberRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/current")
    public OrganizationResponse current() {
        return organizationService.currentOrganization();
    }

    @PatchMapping("/current")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public OrganizationResponse updateCurrent(@Valid @RequestBody OrganizationUpdateRequest request) {
        return organizationService.updateCurrent(request);
    }

    @PostMapping(value = "/current/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public OrganizationResponse uploadLogo(@RequestPart("file") MultipartFile file) {
        return organizationService.uploadLogo(file);
    }

    @DeleteMapping("/current/logo")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public OrganizationResponse clearLogo() {
        return organizationService.clearLogo();
    }

    @GetMapping("/members")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public List<MembershipResponse> members() {
        return organizationService.listMembers();
    }

    @PostMapping("/invites")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public InviteResponse createInvite(@Valid @RequestBody CreateInviteRequest request) {
        return organizationService.createInvite(request);
    }

    @GetMapping("/invites")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public List<InviteResponse> listInvites() {
        return organizationService.listPendingInvites();
    }

    @PatchMapping("/members/{membershipId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public MembershipResponse updateMember(
            @PathVariable UUID membershipId,
            @Valid @RequestBody UpdateMemberRequest request) {
        return organizationService.updateMember(membershipId, request);
    }

    @DeleteMapping("/members/{membershipId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public void deactivateMember(@PathVariable UUID membershipId) {
        organizationService.deactivateMember(membershipId);
    }

    @GetMapping("/current/data-assets")
    public List<CompanyDataAssetResponse> listDataAssets() {
        return organizationService.listDataAssets();
    }

    @PostMapping(value = "/current/data-assets/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public CompanyDataAssetResponse uploadDataAsset(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String description) {
        return organizationService.uploadDataAsset(file, category, description);
    }

    @PostMapping("/current/data-assets")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public CompanyDataAssetResponse createDataAsset(@Valid @RequestBody CompanyDataAssetRequest request) {
        return organizationService.createDataAsset(request);
    }

    @PutMapping("/current/data-assets/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public CompanyDataAssetResponse updateDataAsset(
            @PathVariable UUID id,
            @Valid @RequestBody CompanyDataAssetRequest request) {
        return organizationService.updateDataAsset(id, request);
    }

    @DeleteMapping("/current/data-assets/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public void deleteDataAsset(@PathVariable UUID id) {
        organizationService.deleteDataAsset(id);
    }
}
