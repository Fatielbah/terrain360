package Pfe.T360.service;

import Pfe.T360.dto.TicketDto;
import Pfe.T360.entity.Ticket;
import Pfe.T360.entity.Ticket.Priorite;
import Pfe.T360.entity.Ticket.StatutTicket;
import java.time.LocalDateTime;
import java.util.List;

public interface TicketService {
    Ticket createTicket(TicketDto ticket);
    Ticket updateTicket(Long id, TicketDto  ticket);
    void deleteTicket(Long id);
    Ticket getTicketById(Long id);
    List<TicketDto> getAllTickets();
    List<Ticket> getTicketsByStatut(StatutTicket statut);
    List<Ticket> getTicketsByPriorite(Priorite priorite);
    List<Ticket> getTicketsByMateriel(Long materielId);
    List<Ticket> getTicketsByDeclarant(Long declarantId);
    List<Ticket> getTicketsByTechnicien(Long technicienId);
    List<Ticket> getTicketsBetweenDates(LocalDateTime start, LocalDateTime end);
    Ticket assignTechnicien(Long ticketId, Long technicienId);
    Ticket updateStatut(Long ticketId, StatutTicket statut);
}