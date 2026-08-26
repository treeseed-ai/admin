import type { ApiClientFacade } from "../api-client.ts";
import { headersMethod } from "./support/contracts/headers.ts";
import { urlMethod } from "./support/contracts/url.ts";
import { invokeMethod, requestMethod } from "./support/contracts/request.ts";
import { accountIdentityMethod } from "./accounts/contracts/account-identity.ts";
import { accountPreferencesMethod } from "./accounts/contracts/account-preferences.ts";
import { authProvidersMethod } from "./capacity/providers/contracts/auth-providers.ts";
import { requestPasswordResetMethod } from "./accounts/creation/request-password-reset.ts";
import { completePasswordResetMethod } from "./accounts/lifecycle/complete-password-reset.ts";
import { confirmEmailMethod } from "./accounts/lifecycle/confirm-email.ts";
import { approveDeviceMethod } from "./runtime/lifecycle/approve-device.ts";
import { claimUsernameMethod } from "./accounts/lifecycle/claim-username.ts";
import { updateAccountProfileMethod } from "./accounts/updates/update-account-profile.ts";
import { updateAccountPreferencesMethod } from "./accounts/updates/update-account-preferences.ts";
import { addAccountEmailMethod } from "./accounts/creation/add-account-email.ts";
import { resendAccountEmailMethod } from "./accounts/contracts/resend-account-email.ts";
import { setPrimaryAccountEmailMethod } from "./accounts/updates/set-primary-account-email.ts";
import { deleteAccountEmailMethod } from "./accounts/retirement/delete-account-email.ts";
import { updateAccountPasswordMethod } from "./accounts/updates/update-account-password.ts";
import { unlinkAccountProviderMethod } from "./capacity/providers/contracts/unlink-account-provider.ts";
import { accountSessionsMethod } from "./accounts/contracts/account-sessions.ts";
import { revokeAccountSessionMethod } from "./accounts/retirement/revoke-account-session.ts";
import { notificationPreferencesMethod } from "./accounts/contracts/notification-preferences.ts";
import { accountNotificationsMethod } from "./accounts/contracts/account-notifications.ts";
import { updateNotificationPreferencesMethod } from "./accounts/updates/update-notification-preferences.ts";
import { listProjectsForPrincipalMethod } from "./projects/projects-core/queries/list-projects-for-principal.ts";
import { personalThemesMethod } from "./support/contracts/personal-themes.ts";
import { createPersonalThemeMethod } from "./support/creation/create-personal-theme.ts";
import { updatePersonalThemeMethod } from "./support/updates/update-personal-theme.ts";
import { deletePersonalThemeMethod } from "./support/retirement/delete-personal-theme.ts";
import { accountDeletionBlockersMethod } from "./accounts/contracts/account-deletion-blockers.ts";
import { deleteCurrentAccountMethod } from "./accounts/retirement/delete-current-account.ts";
import { listTeamsForPrincipalMethod } from "./teams/queries/list-teams-for-principal.ts";
import { listTeamProjectsMethod } from "./projects/projects-core/queries/list-team-projects.ts";
import { getProjectDetailsMethod } from "./projects/projects-core/queries/get-project-details.ts";
import { validatePrivateKnowledgeAccessMethod } from "./content/contracts/validate-private-knowledge-access.ts";
import { recordPrivateKnowledgeOutcomeMethod } from "./content/updates/record-private-knowledge-outcome.ts";
import { getProjectByTeamAndSlugMethod } from "./projects/projects-core/queries/get-project-by-team-and-slug.ts";
import { getProjectSummaryMethod } from "./projects/projects-core/queries/get-project-summary.ts";
import { getProjectAgentsSummaryMethod } from "./projects/projects-core/queries/get-project-agents-summary.ts";
import { getProjectReleasesSummaryMethod } from "./projects/delivery/queries/get-project-releases-summary.ts";
import { getProjectCapacitySummaryMethod } from "./capacity/observability/queries/get-project-capacity-summary.ts";
import { listApprovalRequestsForProjectMethod } from "./projects/projects-core/queries/list-approval-requests-for-project.ts";
import { listApprovalRequestsForTeamMethod } from "./teams/queries/list-approval-requests-for-team.ts";
import { decideApprovalRequestMethod } from "./support/lifecycle/decide-approval-request.ts";
import { getCommonsSummaryMethod } from "./governance/commons/queries/get-commons-summary.ts";
import { getCommonsParticipantMeMethod } from "./governance/commons/queries/get-commons-participant-me.ts";
import { listCommonsParticipantsMethod } from "./governance/commons/queries/list-commons-participants.ts";
import { backfillCommonsParticipantsMethod } from "./governance/commons/contracts/backfill-commons-participants.ts";
import { listCommonsQuestionsMethod } from "./governance/commons/queries/list-commons-questions.ts";
import { answerCommonsQuestionMethod } from "./governance/commons/contracts/answer-commons-question.ts";
import { createCommonsProposalMethod } from "./governance/commons/creation/create-commons-proposal.ts";
import { listCommonsProposalsMethod } from "./governance/commons/queries/list-commons-proposals.ts";
import { getCommonsProposalMethod } from "./governance/commons/queries/get-commons-proposal.ts";
import { reviewCommonsProposalMethod } from "./governance/commons/lifecycle/review-commons-proposal.ts";
import { startCommonsProposalVotingMethod } from "./governance/commons/creation/start-commons-proposal-voting.ts";
import { stewardDecisionForCommonsProposalMethod } from "./governance/commons/lifecycle/steward-decision-for-commons-proposal.ts";
import { listCommonsDecisionsMethod } from "./governance/commons/queries/list-commons-decisions.ts";
import { listCommonsEventsMethod } from "./governance/commons/queries/list-commons-events.ts";
import { deleteTeamInboxItemsByItemKeyMethod } from "./teams/retirement/delete-team-inbox-items-by-item-key.ts";
import { listPersistedTeamInboxItemsMethod } from "./teams/queries/list-persisted-team-inbox-items.ts";
import { listAuditEventsForTargetMethod } from "./support/queries/list-audit-events-for-target.ts";
import { listTeamMembersMethod } from "./teams/queries/list-team-members.ts";
import { getTeamAccessSummaryMethod } from "./teams/queries/get-team-access-summary.ts";
import { getCommerceVendorMethod } from "./commerce/vendors/queries/get-commerce-vendor.ts";
import { requestCommerceVendorMethod } from "./commerce/vendors/creation/request-commerce-vendor.ts";
import { getCommerceVendorStripeStatusMethod } from "./commerce/vendors/queries/get-commerce-vendor-stripe-status.ts";
import { startCommerceVendorStripeOnboardingMethod } from "./commerce/vendors/creation/start-commerce-vendor-stripe-onboarding.ts";
import { markCommerceVendorStripeReturnMethod } from "./commerce/vendors/updates/mark-commerce-vendor-stripe-return.ts";
import { createCommerceVendorStripeLoginLinkMethod } from "./commerce/vendors/creation/create-commerce-vendor-stripe-login-link.ts";
import { listCommerceProductsMethod } from "./commerce/catalog/queries/list-commerce-products.ts";
import { getCommerceProductMethod } from "./commerce/catalog/queries/get-commerce-product.ts";
import { getCommerceOwnershipWorkflowMethod } from "./commerce/ownership/queries/get-commerce-ownership-workflow.ts";
import { updateCommerceOwnershipRecordMethod } from "./commerce/ownership/updates/update-commerce-ownership-record.ts";
import { updateCommerceStewardshipAssignmentMethod } from "./commerce/ownership/updates/update-commerce-stewardship-assignment.ts";
import { endCommerceStewardshipAssignmentMethod } from "./commerce/ownership/contracts/end-commerce-stewardship-assignment.ts";
import { updateCommerceContributionMethod } from "./commerce/governance/updates/update-commerce-contribution.ts";
import { updateCommerceGovernancePolicyMethod } from "./commerce/governance/updates/update-commerce-governance-policy.ts";
import { submitCommerceOwnershipTransferMethod } from "./commerce/ownership/creation/submit-commerce-ownership-transfer.ts";
import { approveCommerceOwnershipTransferMethod } from "./commerce/ownership/lifecycle/approve-commerce-ownership-transfer.ts";
import { rejectCommerceOwnershipTransferMethod } from "./commerce/ownership/lifecycle/reject-commerce-ownership-transfer.ts";
import { cancelCommerceOwnershipTransferMethod } from "./commerce/ownership/retirement/cancel-commerce-ownership-transfer.ts";
import { createCommerceSuccessionEventMethod } from "./commerce/ownership/creation/create-commerce-succession-event.ts";
import { listCommerceSuccessionEventsMethod } from "./commerce/ownership/queries/list-commerce-succession-events.ts";
import { getCommerceVendorSalesSummaryMethod } from "./commerce/vendors/queries/get-commerce-vendor-sales-summary.ts";
import { getCommerceVendorMonitoringMethod } from "./commerce/vendors/queries/get-commerce-vendor-monitoring.ts";
import { listCommerceMarketplaceProductsMethod } from "./commerce/catalog/queries/list-commerce-marketplace-products.ts";
import { getCommerceMarketplaceProductMethod } from "./commerce/catalog/queries/get-commerce-marketplace-product.ts";
import { listCommerceVendorSalesOrdersMethod } from "./commerce/vendors/queries/list-commerce-vendor-sales-orders.ts";
import { listCommerceVendorSalesSubscriptionsMethod } from "./commerce/vendors/queries/list-commerce-vendor-sales-subscriptions.ts";
import { listCommerceVendorSalesEntitlementsMethod } from "./commerce/vendors/queries/list-commerce-vendor-sales-entitlements.ts";
import { listCommerceVendorSalesRefundsMethod } from "./commerce/vendors/queries/list-commerce-vendor-sales-refunds.ts";
import { listCommerceVendorFulfillmentEventsMethod } from "./commerce/vendors/queries/list-commerce-vendor-fulfillment-events.ts";
import { createCommerceOrderRefundMethod } from "./commerce/orders/creation/create-commerce-order-refund.ts";
import { fulfillCommerceOrderItemArtifactMethod } from "./commerce/orders/lifecycle/fulfill-commerce-order-item-artifact.ts";
import { revokeCommerceEntitlementMethod } from "./commerce/payments/retirement/revoke-commerce-entitlement.ts";
import { createCommerceServiceRequestMethod } from "./commerce/services/creation/create-commerce-service-request.ts";
import { listCommerceServiceRequestsMethod } from "./commerce/services/queries/list-commerce-service-requests.ts";
import { getCommerceServiceRequestMethod } from "./commerce/services/queries/get-commerce-service-request.ts";
import { startCommerceServiceScopingMethod } from "./commerce/commerce-core/creation/start-commerce-service-scoping.ts";
import { updateCommerceServiceRequestMethod } from "./commerce/services/updates/update-commerce-service-request.ts";
import { cancelCommerceServiceRequestMethod } from "./commerce/services/retirement/cancel-commerce-service-request.ts";
import { createCommerceServiceQuoteMethod } from "./commerce/services/creation/create-commerce-service-quote.ts";
import { listCommerceServiceQuotesMethod } from "./commerce/services/queries/list-commerce-service-quotes.ts";
import { submitCommerceServiceQuoteMethod } from "./commerce/services/creation/submit-commerce-service-quote.ts";
import { buyerApproveCommerceServiceQuoteMethod } from "./commerce/services/contracts/buyer-approve-commerce-service-quote.ts";
import { vendorApproveCommerceServiceQuoteMethod } from "./commerce/services/contracts/vendor-approve-commerce-service-quote.ts";
import { rejectCommerceServiceQuoteMethod } from "./commerce/services/lifecycle/reject-commerce-service-quote.ts";
import { getCommerceServiceContractMethod } from "./commerce/services/queries/get-commerce-service-contract.ts";
import { linkCommerceServiceContractWorkMethod } from "./commerce/services/contracts/link-commerce-service-contract-work.ts";
import { fulfillCommerceServiceContractMethod } from "./commerce/services/lifecycle/fulfill-commerce-service-contract.ts";
import { cancelCommerceServiceContractMethod } from "./commerce/services/retirement/cancel-commerce-service-contract.ts";
import { listCommerceServiceEventsMethod } from "./commerce/services/queries/list-commerce-service-events.ts";
import { listCommerceCapacityListingsMethod } from "./commerce/capacity/queries/list-commerce-capacity-listings.ts";
import { getCommerceCapacityListingMethod } from "./commerce/capacity/queries/get-commerce-capacity-listing.ts";
import { getCommerceCapacityListingForProductMethod } from "./commerce/capacity/queries/get-commerce-capacity-listing-for-product.ts";
import { createCommerceCapacityListingMethod } from "./commerce/capacity/creation/create-commerce-capacity-listing.ts";
import { updateCommerceCapacityListingMethod } from "./commerce/capacity/updates/update-commerce-capacity-listing.ts";
import { submitCommerceCapacityListingMethod } from "./commerce/capacity/creation/submit-commerce-capacity-listing.ts";
import { approveCommerceCapacityListingMethod } from "./commerce/capacity/lifecycle/approve-commerce-capacity-listing.ts";
import { rejectCommerceCapacityListingMethod } from "./commerce/capacity/lifecycle/reject-commerce-capacity-listing.ts";
import { suspendCommerceCapacityListingMethod } from "./commerce/capacity/retirement/suspend-commerce-capacity-listing.ts";
import { archiveCommerceCapacityListingMethod } from "./commerce/capacity/retirement/archive-commerce-capacity-listing.ts";
import { createCommerceCapacityListingInquiryMethod } from "./commerce/capacity/creation/create-commerce-capacity-listing-inquiry.ts";
import { listCommerceCapacityListingInquiriesMethod } from "./commerce/capacity/queries/list-commerce-capacity-listing-inquiries.ts";
import { getCommerceCapacityListingInquiryMethod } from "./commerce/capacity/queries/get-commerce-capacity-listing-inquiry.ts";
import { reviewCommerceCapacityInquiryMethod } from "./commerce/capacity/lifecycle/review-commerce-capacity-inquiry.ts";
import { approveCommerceCapacityInquiryForScopingMethod } from "./commerce/capacity/lifecycle/approve-commerce-capacity-inquiry-for-scoping.ts";
import { declineCommerceCapacityInquiryMethod } from "./commerce/capacity/lifecycle/decline-commerce-capacity-inquiry.ts";
import { cancelCommerceCapacityInquiryMethod } from "./commerce/capacity/retirement/cancel-commerce-capacity-inquiry.ts";
import { evaluateTeamDeletionBlockersMethod } from "./teams/contracts/evaluate-team-deletion-blockers.ts";
import { evaluateProjectDeletionBlockersMethod } from "./projects/projects-core/contracts/evaluate-project-deletion-blockers.ts";
import { getTeamTreeDxMethod } from "./treedx/repositories/queries/get-team-tree-dx.ts";
import { updateTeamTreeDxMethod } from "./treedx/repositories/updates/update-team-tree-dx.ts";
import { provisionTeamTreeDxMethod } from "./treedx/repositories/creation/provision-team-tree-dx.ts";
import { listTreeDxMirrorsMethod } from "./treedx/repositories/queries/list-tree-dx-mirrors.ts";
import { createTreeDxMirrorMethod } from "./treedx/repositories/creation/create-tree-dx-mirror.ts";
import { listTreeDxSharesMethod } from "./treedx/repositories/queries/list-tree-dx-shares.ts";
import { createTreeDxShareMethod } from "./treedx/repositories/creation/create-tree-dx-share.ts";
import { getProjectTreeDxLibraryMethod } from "./projects/knowledge/queries/get-project-tree-dx-library.ts";
import { upsertProjectTreeDxLibraryMethod } from "./projects/knowledge/creation/upsert-project-tree-dx-library.ts";
import { getProjectRepositoryTopologyMethod } from "./projects/repositories/queries/get-project-repository-topology.ts";
import { updateProjectRepositoryTopologyMethod } from "./projects/repositories/updates/update-project-repository-topology.ts";
import { listCapacityAllocationSetsMethod } from "./capacity/allocations/queries/list-capacity-allocation-sets.ts";
import { listProviderAvailabilitySessionsMethod } from "./capacity/providers/queries/list-provider-availability-sessions.ts";
import { listProviderAssignmentsMethod } from "./capacity/assignments/queries/list-provider-assignments.ts";
import { listExecutionRunsMethod } from "./support/queries/list-execution-runs.ts";
import { listProjectAgentClassesMethod } from "./projects/agents/queries/list-project-agent-classes.ts";
import { listProjectAgentModeRunsMethod } from "./projects/agents/queries/list-project-agent-mode-runs.ts";
import { listProjectAgentFallbackOutputsMethod } from "./projects/agents/queries/list-project-agent-fallback-outputs.ts";
import { listProjectTreeDxProxyAuditMethod } from "./projects/knowledge/queries/list-project-tree-dx-proxy-audit.ts";
import { getProjectCapacityRuntimeDiagnosticsMethod } from "./capacity/observability/queries/get-project-capacity-runtime-diagnostics.ts";
import { getProviderAssignmentExplanationMethod } from "./capacity/assignments/queries/get-provider-assignment-explanation.ts";
import { getDecisionPlanningStatusMethod } from "./support/queries/get-decision-planning-status.ts";
import { listDecisionExecutionInputsMethod } from "./support/queries/list-decision-execution-inputs.ts";
import { listDecisionCapacityPlansMethod } from "./capacity/planning/queries/list-decision-capacity-plans.ts";
import { getCapacityPlanMethod } from "./capacity/planning/queries/get-capacity-plan.ts";
import { getWorkdayCapacitySummaryMethod } from "./capacity/workdays/queries/get-workday-capacity-summary.ts";
import { listWorkdayRunsMethod } from "./capacity/workdays/queries/list-workday-runs.ts";
import { createWorkdayRunMethod } from "./capacity/workdays/creation/create-workday-run.ts";
import { getWorkdayRunMethod } from "./capacity/workdays/queries/get-workday-run.ts";
import { listCapacityLedgerEntriesMethod } from "./capacity/accounting/queries/list-capacity-ledger-entries.ts";
import { listCapacityRoutingDecisionsForProjectMethod } from "./capacity/planning/queries/list-capacity-routing-decisions-for-project.ts";
import { listSeedRunsMethod } from "./seeds/queries/list-seed-runs.ts";
import { listCatalogItemsMethod } from "./commerce/catalog/queries/list-catalog-items.ts";
import { getCatalogItemBySlugMethod } from "./commerce/catalog/queries/get-catalog-item-by-slug.ts";
import { listCatalogArtifactVersionsMethod } from "./commerce/orders/queries/list-catalog-artifact-versions.ts";
import { acceptTeamInviteMethod } from "./teams/lifecycle/accept-team-invite.ts";
import { getTeamInviteMethod } from "./teams/queries/get-team-invite.ts";
import { loadTeamProfileByNameMethod } from "./teams/queries/load-team-profile-by-name.ts";
import { loadUserProfileByUsernameMethod } from "./accounts/queries/load-user-profile-by-username.ts";
import { createFeedbackExportMethod, getFeedbackExportMethod, getFeedbackMethod, listFeedbackMethod, updateFeedbackStatusMethod } from "./support/contracts/feedback.ts";
export function installApiClientFacadeMethods(prototype: ApiClientFacade) {
  prototype.headers = headersMethod;
  prototype.url = urlMethod;
  prototype.request = requestMethod;
  prototype.invoke = invokeMethod;
  prototype.accountIdentity = accountIdentityMethod;
  prototype.accountPreferences = accountPreferencesMethod;
  prototype.authProviders = authProvidersMethod;
  prototype.requestPasswordReset = requestPasswordResetMethod;
  prototype.completePasswordReset = completePasswordResetMethod;
  prototype.confirmEmail = confirmEmailMethod;
  prototype.approveDevice = approveDeviceMethod;
  prototype.claimUsername = claimUsernameMethod;
  prototype.updateAccountProfile = updateAccountProfileMethod;
  prototype.updateAccountPreferences = updateAccountPreferencesMethod;
  prototype.addAccountEmail = addAccountEmailMethod;
  prototype.resendAccountEmail = resendAccountEmailMethod;
  prototype.setPrimaryAccountEmail = setPrimaryAccountEmailMethod;
  prototype.deleteAccountEmail = deleteAccountEmailMethod;
  prototype.updateAccountPassword = updateAccountPasswordMethod;
  prototype.unlinkAccountProvider = unlinkAccountProviderMethod;
  prototype.accountSessions = accountSessionsMethod;
  prototype.revokeAccountSession = revokeAccountSessionMethod;
  prototype.notificationPreferences = notificationPreferencesMethod;
  prototype.accountNotifications = accountNotificationsMethod;
  prototype.updateNotificationPreferences = updateNotificationPreferencesMethod;
  prototype.listProjectsForPrincipal = listProjectsForPrincipalMethod;
  prototype.personalThemes = personalThemesMethod;
  prototype.createPersonalTheme = createPersonalThemeMethod;
  prototype.updatePersonalTheme = updatePersonalThemeMethod;
  prototype.deletePersonalTheme = deletePersonalThemeMethod;
  prototype.accountDeletionBlockers = accountDeletionBlockersMethod;
  prototype.deleteCurrentAccount = deleteCurrentAccountMethod;
  prototype.listTeamsForPrincipal = listTeamsForPrincipalMethod;
  prototype.listTeamProjects = listTeamProjectsMethod;
  prototype.getProjectDetails = getProjectDetailsMethod;
  prototype.validatePrivateKnowledgeAccess =
    validatePrivateKnowledgeAccessMethod;
  prototype.recordPrivateKnowledgeOutcome = recordPrivateKnowledgeOutcomeMethod;
  prototype.getProjectByTeamAndSlug = getProjectByTeamAndSlugMethod;
  prototype.getProjectSummary = getProjectSummaryMethod;
  prototype.getProjectAgentsSummary = getProjectAgentsSummaryMethod;
  prototype.getProjectReleasesSummary = getProjectReleasesSummaryMethod;
  prototype.getProjectCapacitySummary = getProjectCapacitySummaryMethod;
  prototype.listApprovalRequestsForProject =
    listApprovalRequestsForProjectMethod;
  prototype.listApprovalRequestsForTeam = listApprovalRequestsForTeamMethod;
  prototype.decideApprovalRequest = decideApprovalRequestMethod;
  prototype.getCommonsSummary = getCommonsSummaryMethod;
  prototype.getCommonsParticipantMe = getCommonsParticipantMeMethod;
  prototype.listCommonsParticipants = listCommonsParticipantsMethod;
  prototype.backfillCommonsParticipants = backfillCommonsParticipantsMethod;
  prototype.listCommonsQuestions = listCommonsQuestionsMethod;
  prototype.answerCommonsQuestion = answerCommonsQuestionMethod;
  prototype.createCommonsProposal = createCommonsProposalMethod;
  prototype.listCommonsProposals = listCommonsProposalsMethod;
  prototype.getCommonsProposal = getCommonsProposalMethod;
  prototype.reviewCommonsProposal = reviewCommonsProposalMethod;
  prototype.startCommonsProposalVoting = startCommonsProposalVotingMethod;
  prototype.stewardDecisionForCommonsProposal =
    stewardDecisionForCommonsProposalMethod;
  prototype.listCommonsDecisions = listCommonsDecisionsMethod;
  prototype.listCommonsEvents = listCommonsEventsMethod;
  prototype.deleteTeamInboxItemsByItemKey = deleteTeamInboxItemsByItemKeyMethod;
  prototype.listPersistedTeamInboxItems = listPersistedTeamInboxItemsMethod;
  prototype.listAuditEventsForTarget = listAuditEventsForTargetMethod;
  prototype.listTeamMembers = listTeamMembersMethod;
  prototype.getTeamAccessSummary = getTeamAccessSummaryMethod;
  prototype.getCommerceVendor = getCommerceVendorMethod;
  prototype.requestCommerceVendor = requestCommerceVendorMethod;
  prototype.getCommerceVendorStripeStatus = getCommerceVendorStripeStatusMethod;
  prototype.startCommerceVendorStripeOnboarding =
    startCommerceVendorStripeOnboardingMethod;
  prototype.markCommerceVendorStripeReturn =
    markCommerceVendorStripeReturnMethod;
  prototype.createCommerceVendorStripeLoginLink =
    createCommerceVendorStripeLoginLinkMethod;
  prototype.listCommerceProducts = listCommerceProductsMethod;
  prototype.getCommerceProduct = getCommerceProductMethod;
  prototype.getCommerceOwnershipWorkflow = getCommerceOwnershipWorkflowMethod;
  prototype.updateCommerceOwnershipRecord = updateCommerceOwnershipRecordMethod;
  prototype.updateCommerceStewardshipAssignment =
    updateCommerceStewardshipAssignmentMethod;
  prototype.endCommerceStewardshipAssignment =
    endCommerceStewardshipAssignmentMethod;
  prototype.updateCommerceContribution = updateCommerceContributionMethod;
  prototype.updateCommerceGovernancePolicy =
    updateCommerceGovernancePolicyMethod;
  prototype.submitCommerceOwnershipTransfer =
    submitCommerceOwnershipTransferMethod;
  prototype.approveCommerceOwnershipTransfer =
    approveCommerceOwnershipTransferMethod;
  prototype.rejectCommerceOwnershipTransfer =
    rejectCommerceOwnershipTransferMethod;
  prototype.cancelCommerceOwnershipTransfer =
    cancelCommerceOwnershipTransferMethod;
  prototype.createCommerceSuccessionEvent = createCommerceSuccessionEventMethod;
  prototype.listCommerceSuccessionEvents = listCommerceSuccessionEventsMethod;
  prototype.getCommerceVendorSalesSummary = getCommerceVendorSalesSummaryMethod;
  prototype.getCommerceVendorMonitoring = getCommerceVendorMonitoringMethod;
  prototype.listCommerceMarketplaceProducts =
    listCommerceMarketplaceProductsMethod;
  prototype.getCommerceMarketplaceProduct = getCommerceMarketplaceProductMethod;
  prototype.listCommerceVendorSalesOrders = listCommerceVendorSalesOrdersMethod;
  prototype.listCommerceVendorSalesSubscriptions =
    listCommerceVendorSalesSubscriptionsMethod;
  prototype.listCommerceVendorSalesEntitlements =
    listCommerceVendorSalesEntitlementsMethod;
  prototype.listCommerceVendorSalesRefunds =
    listCommerceVendorSalesRefundsMethod;
  prototype.listCommerceVendorFulfillmentEvents =
    listCommerceVendorFulfillmentEventsMethod;
  prototype.createCommerceOrderRefund = createCommerceOrderRefundMethod;
  prototype.fulfillCommerceOrderItemArtifact =
    fulfillCommerceOrderItemArtifactMethod;
  prototype.revokeCommerceEntitlement = revokeCommerceEntitlementMethod;
  prototype.createCommerceServiceRequest = createCommerceServiceRequestMethod;
  prototype.listCommerceServiceRequests = listCommerceServiceRequestsMethod;
  prototype.getCommerceServiceRequest = getCommerceServiceRequestMethod;
  prototype.startCommerceServiceScoping = startCommerceServiceScopingMethod;
  prototype.updateCommerceServiceRequest = updateCommerceServiceRequestMethod;
  prototype.cancelCommerceServiceRequest = cancelCommerceServiceRequestMethod;
  prototype.createCommerceServiceQuote = createCommerceServiceQuoteMethod;
  prototype.listCommerceServiceQuotes = listCommerceServiceQuotesMethod;
  prototype.submitCommerceServiceQuote = submitCommerceServiceQuoteMethod;
  prototype.buyerApproveCommerceServiceQuote =
    buyerApproveCommerceServiceQuoteMethod;
  prototype.vendorApproveCommerceServiceQuote =
    vendorApproveCommerceServiceQuoteMethod;
  prototype.rejectCommerceServiceQuote = rejectCommerceServiceQuoteMethod;
  prototype.getCommerceServiceContract = getCommerceServiceContractMethod;
  prototype.linkCommerceServiceContractWork =
    linkCommerceServiceContractWorkMethod;
  prototype.fulfillCommerceServiceContract =
    fulfillCommerceServiceContractMethod;
  prototype.cancelCommerceServiceContract = cancelCommerceServiceContractMethod;
  prototype.listCommerceServiceEvents = listCommerceServiceEventsMethod;
  prototype.listCommerceCapacityListings = listCommerceCapacityListingsMethod;
  prototype.getCommerceCapacityListing = getCommerceCapacityListingMethod;
  prototype.getCommerceCapacityListingForProduct =
    getCommerceCapacityListingForProductMethod;
  prototype.createCommerceCapacityListing = createCommerceCapacityListingMethod;
  prototype.updateCommerceCapacityListing = updateCommerceCapacityListingMethod;
  prototype.submitCommerceCapacityListing = submitCommerceCapacityListingMethod;
  prototype.approveCommerceCapacityListing =
    approveCommerceCapacityListingMethod;
  prototype.rejectCommerceCapacityListing = rejectCommerceCapacityListingMethod;
  prototype.suspendCommerceCapacityListing =
    suspendCommerceCapacityListingMethod;
  prototype.archiveCommerceCapacityListing =
    archiveCommerceCapacityListingMethod;
  prototype.createCommerceCapacityListingInquiry =
    createCommerceCapacityListingInquiryMethod;
  prototype.listCommerceCapacityListingInquiries =
    listCommerceCapacityListingInquiriesMethod;
  prototype.getCommerceCapacityListingInquiry =
    getCommerceCapacityListingInquiryMethod;
  prototype.reviewCommerceCapacityInquiry = reviewCommerceCapacityInquiryMethod;
  prototype.approveCommerceCapacityInquiryForScoping =
    approveCommerceCapacityInquiryForScopingMethod;
  prototype.declineCommerceCapacityInquiry =
    declineCommerceCapacityInquiryMethod;
  prototype.cancelCommerceCapacityInquiry = cancelCommerceCapacityInquiryMethod;
  prototype.evaluateTeamDeletionBlockers = evaluateTeamDeletionBlockersMethod;
  prototype.evaluateProjectDeletionBlockers =
    evaluateProjectDeletionBlockersMethod;
  prototype.getTeamTreeDx = getTeamTreeDxMethod;
  prototype.updateTeamTreeDx = updateTeamTreeDxMethod;
  prototype.provisionTeamTreeDx = provisionTeamTreeDxMethod;
  prototype.listTreeDxMirrors = listTreeDxMirrorsMethod;
  prototype.createTreeDxMirror = createTreeDxMirrorMethod;
  prototype.listTreeDxShares = listTreeDxSharesMethod;
  prototype.createTreeDxShare = createTreeDxShareMethod;
  prototype.getProjectTreeDxLibrary = getProjectTreeDxLibraryMethod;
  prototype.upsertProjectTreeDxLibrary = upsertProjectTreeDxLibraryMethod;
  prototype.getProjectRepositoryTopology = getProjectRepositoryTopologyMethod;
  prototype.updateProjectRepositoryTopology =
    updateProjectRepositoryTopologyMethod;
  prototype.listCapacityAllocationSets = listCapacityAllocationSetsMethod;
  prototype.listProviderAvailabilitySessions =
    listProviderAvailabilitySessionsMethod;
  prototype.listProviderAssignments = listProviderAssignmentsMethod;
  prototype.listExecutionRuns = listExecutionRunsMethod;
  prototype.listProjectAgentClasses = listProjectAgentClassesMethod;
  prototype.listProjectAgentModeRuns = listProjectAgentModeRunsMethod;
  prototype.listProjectAgentFallbackOutputs =
    listProjectAgentFallbackOutputsMethod;
  prototype.listProjectTreeDxProxyAudit = listProjectTreeDxProxyAuditMethod;
  prototype.getProjectCapacityRuntimeDiagnostics =
    getProjectCapacityRuntimeDiagnosticsMethod;
  prototype.getProviderAssignmentExplanation =
    getProviderAssignmentExplanationMethod;
  prototype.getDecisionPlanningStatus = getDecisionPlanningStatusMethod;
  prototype.listDecisionExecutionInputs = listDecisionExecutionInputsMethod;
  prototype.listDecisionCapacityPlans = listDecisionCapacityPlansMethod;
  prototype.getCapacityPlan = getCapacityPlanMethod;
  prototype.getWorkdayCapacitySummary = getWorkdayCapacitySummaryMethod;
  prototype.listWorkdayRuns = listWorkdayRunsMethod;
  prototype.createWorkdayRun = createWorkdayRunMethod;
  prototype.getWorkdayRun = getWorkdayRunMethod;
  prototype.listCapacityLedgerEntries = listCapacityLedgerEntriesMethod;
  prototype.listCapacityRoutingDecisionsForProject =
    listCapacityRoutingDecisionsForProjectMethod;
  prototype.listSeedRuns = listSeedRunsMethod;
  prototype.listCatalogItems = listCatalogItemsMethod;
  prototype.getCatalogItemBySlug = getCatalogItemBySlugMethod;
  prototype.listCatalogArtifactVersions = listCatalogArtifactVersionsMethod;
  prototype.acceptTeamInvite = acceptTeamInviteMethod;
  prototype.getTeamInvite = getTeamInviteMethod;
  prototype.loadTeamProfileByName = loadTeamProfileByNameMethod;
  prototype.loadUserProfileByUsername = loadUserProfileByUsernameMethod;
  prototype.listFeedback = listFeedbackMethod;
  prototype.getFeedback = getFeedbackMethod;
  prototype.updateFeedbackStatus = updateFeedbackStatusMethod;
  prototype.createFeedbackExport = createFeedbackExportMethod;
  prototype.getFeedbackExport = getFeedbackExportMethod;
}
