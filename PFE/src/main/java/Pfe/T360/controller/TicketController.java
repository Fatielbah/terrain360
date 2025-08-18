package Pfe.T360.controller;

import Pfe.T360.dto.NotificationDTO;
import Pfe.T360.dto.TicketDto;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Ticket;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.entity.Ticket.Priorite;
import Pfe.T360.entity.Ticket.StatutTicket;
import Pfe.T360.repository.TicketRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.NotificationService;
import Pfe.T360.service.TicketService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final TicketRepository ticketRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;

    public TicketController(TicketService ticketService,TicketRepository ticketRepository,
    		UtilisateurRepository utilisateurRepository,
    		NotificationService notificationService) {
        this.ticketService = ticketService;
        this.ticketRepository =ticketRepository;
        this.utilisateurRepository =utilisateurRepository;
        this.notificationService =notificationService;
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody TicketDto ticketDTO) {
        return ResponseEntity.ok(ticketService.createTicket(ticketDTO));
    }
    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(@PathVariable Long id, @RequestBody TicketDto  ticket) {
        return ResponseEntity.ok(ticketService.updateTicket(id, ticket));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping
    public ResponseEntity<List<TicketDto>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Ticket>> getTicketsByStatut(@PathVariable StatutTicket statut) {
        return ResponseEntity.ok(ticketService.getTicketsByStatut(statut));
    }

    @GetMapping("/priorite/{priorite}")
    public ResponseEntity<List<Ticket>> getTicketsByPriorite(@PathVariable Priorite priorite) {
        return ResponseEntity.ok(ticketService.getTicketsByPriorite(priorite));
    }

    @GetMapping("/declarant/{declarantId}")
    public ResponseEntity<List<Ticket>> getTicketsByDeclarant(@PathVariable Long declarantId) {
        return ResponseEntity.ok(ticketService.getTicketsByDeclarant(declarantId));
    }

    @GetMapping("/technicien/{technicienId}")
    public ResponseEntity<List<Ticket>> getTicketsByTechnicien(@PathVariable Long technicienId) {
        return ResponseEntity.ok(ticketService.getTicketsByTechnicien(technicienId));
    }

    @GetMapping("/periode")
    public ResponseEntity<List<Ticket>> getTicketsBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        return ResponseEntity.ok(ticketService.getTicketsBetweenDates(start, end));
    }

    @PatchMapping("/{ticketId}/assigner")
    public ResponseEntity<Ticket> assignTechnicien(
            @PathVariable Long ticketId,
            @RequestParam Long technicienId) {
        
        return ResponseEntity.ok(ticketService.assignTechnicien(ticketId, technicienId));
    }

    @PatchMapping("/{ticketId}/statut")
    public ResponseEntity<Ticket> updateStatut(
            @PathVariable Long ticketId,
            @RequestParam StatutTicket statut) {
        
        return ResponseEntity.ok(ticketService.updateStatut(ticketId, statut));
    }
    
    
    @PutMapping("/{id}/resoudre")
    public Ticket resoudreTicket(@PathVariable Long id, @RequestParam Long technicienId) {
        Optional<Ticket> optionalTicket = ticketRepository.findById(id);
        if (optionalTicket.isPresent()) {
            Ticket ticket = optionalTicket.get();
            ticket.setStatut(Ticket.StatutTicket.RESOLU);
            ticket.setDateResolution(LocalDateTime.now());

            // Assigner le technicien
            Utilisateur technicien = utilisateurRepository.findById(technicienId)
                    .orElseThrow(() -> new RuntimeException("Technicien non trouvé avec l'id : " + technicienId));
            ticket.setTechnicien(technicien);

            Ticket savedTicket = ticketRepository.save(ticket);

            // ✅ Création et envoi de la notification
            NotificationDTO notification = NotificationDTO.builder()
                    .titre("Ticket résolu")
                    .message(String.format(
                            "Votre ticket concernant le matériel %s (%s) a été résolu.",
                            savedTicket.getMateriel().getNumeroSerie(),
                            savedTicket.getMateriel().getMarque()
                    ))
                    .type(Notification.TypeNotification.RESOUDRE_TICKET.name())
                    .ticketId(savedTicket.getId()) // ou alertId selon ta nomenclature
                    .dateCreation(LocalDateTime.now())
                    .lue(false)
                    .destinataireId(savedTicket.getDeclarant().getId())
                    .expediteurId(technicien.getId())
                    .build();

            notificationService.createNotification(notification);

            return savedTicket;
        } else {
            throw new RuntimeException("Ticket non trouvé avec l'id : " + id);
        }
    }

    @GetMapping("/statut/ouvert-ou-encours/count")
    public long getNombreTicketsOuvertsOuEnCours() {
        return ticketRepository.countByStatutIn(
            List.of(Ticket.StatutTicket.OUVERT, Ticket.StatutTicket.EN_COURS)
        );
    }

}