package Pfe.T360.dto;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class InvitationDto {
    private Long id;
    private Long inviteurId;
    private Long inviteId;
    private Long planificationId;
    private String status;
}
