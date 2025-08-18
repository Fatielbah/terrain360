package Pfe.T360.dto;

import java.time.LocalDateTime;

import Pfe.T360.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private String titre;
    private String message;
    private String type;         // RAPPEL, INVITATION, etc.
    private boolean lue;
    private Long invitationId;
    private Long evenementId;    // si la notification concerne un événement
    private Long ticketId;       // si elle concerne un ticket
    private LocalDateTime dateCreation = LocalDateTime.now();
    private Long alertId;
    private Long materiel;
    private Long destinataireId; // utile pour WebSocket ou REST
    private Long expediteurId;
    public static NotificationDTO fromEntity(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .titre(notification.getTitre())
                .message(notification.getMessage())
                .type(notification.getType().name())
                .lue(notification.isLue())
                .invitationId(notification.getInvitationId())
                .evenementId(notification.getEvenementId())
                .ticketId(notification.getTicketId())
                .dateCreation(notification.getDateCreation())
                .destinataireId(notification.getDestinataire().getId())
                .expediteurId(notification.getExpediteur().getId())
                .build();
    }
}
