package Pfe.T360.dto;

import java.time.LocalDateTime;

import Pfe.T360.entity.Ticket.Priorite;
import Pfe.T360.entity.Ticket.StatutTicket;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketDto {
	private Long id;
	private String description;   
    private LocalDateTime dateCreation;
    private LocalDateTime dateResolution;
    private Priorite priorite;   
    private StatutTicket statut;
    private Long materielId;
    private Long declarantId;
    private Long  technicienId;
}
