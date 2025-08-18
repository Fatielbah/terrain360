package Pfe.T360.dto;

import java.util.List;

public class InvitationReques {
    private List<Long> serviceIds;

    // Constructeurs
    public InvitationReques() {}

    public InvitationReques(List<Long> serviceIds) {
        this.serviceIds = serviceIds;
    }

    // Getters & Setters
    public List<Long> getServiceIds() {
        return serviceIds;
    }

    public void setServiceIds(List<Long> serviceIds) {
        this.serviceIds = serviceIds;
    }
}