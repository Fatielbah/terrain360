package Pfe.T360.dto;

import Pfe.T360.entity.Role;
import lombok.Data;

@Data
public class RoleUpdateRequest {
    private Long userId;
    private Role newRole;
    private Long serviceId;
    
    
}