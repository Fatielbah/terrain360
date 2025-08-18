package Pfe.T360.service.impl;

import Pfe.T360.dto.NotificationDTO;
import Pfe.T360.dto.TicketDto;
import Pfe.T360.entity.*;
import Pfe.T360.repository.MaterielRepository;
import Pfe.T360.repository.TicketRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.NotificationService;
import Pfe.T360.service.TicketService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MaterielRepository materielRepository;
    private final NotificationService notificationService;

    public TicketServiceImpl(TicketRepository ticketRepository, 
                           UtilisateurRepository utilisateurRepository,
                           MaterielRepository materielRepository,
                           NotificationService notificationService
                           ) {
        this.ticketRepository = ticketRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.materielRepository =materielRepository;
       this.notificationService =notificationService;
    }

    @Override
    public Ticket createTicket(TicketDto ticketDTO) {
        Ticket ticket = new Ticket();
        ticket.setDescription(ticketDTO.getDescription());
        ticket.setPriorite(ticketDTO.getPriorite());

        // Récupération des entités associées
        Materiel materiel = materielRepository.findById(ticketDTO.getMaterielId())
            .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));
        Utilisateur declarant = utilisateurRepository.findById(ticketDTO.getDeclarantId())
            .orElseThrow(() -> new RuntimeException("Déclarant non trouvé"));

        ticket.setMateriel(materiel);
        ticket.setDeclarant(declarant);
        ticket.setDateCreation(LocalDateTime.now());
        ticket.setStatut(Ticket.StatutTicket.OUVERT);

        // Sauvegarder le ticket
        Ticket savedTicket = ticketRepository.save(ticket);

        // Vérifier si le déclarant est un informaticien
        boolean isDeclarantTechnicien = declarant.getRole() == Role.INFORMATICIEN;

        if (isDeclarantTechnicien) {
            notificationService.envoyerNotificationTousTechniciensSaufDeclarant(
                "Nouveau ticket créé par un technicien",
                "Un nouveau ticket a été créé concernant un matériel en panne.",
                Notification.TypeNotification.DECLARER_EN_PANNE,
                savedTicket.getId(),
                declarant.getId()
            );
        } else {
            notificationService.envoyerNotificationTousTechniciens(
                "Nouveau ticket : Panne détectée",
                "Un nouveau ticket a été assigné concernant un matériel en panne.",
                Notification.TypeNotification.DECLARER_EN_PANNE,
                savedTicket.getId(),
                declarant.getId()
            );
        }

        return savedTicket;
    }
    @Override
    public Ticket updateTicket(Long id, TicketDto ticket) {
        Ticket existing = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

        Materiel materiel = materielRepository.findById(ticket.getMaterielId())
                .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));

        Utilisateur declarant = utilisateurRepository.findById(ticket.getDeclarantId())
                .orElseThrow(() -> new RuntimeException("Déclarant non trouvé"));

        Utilisateur technicien = null;
        if (ticket.getTechnicienId() != null) {
            technicien = utilisateurRepository.findById(ticket.getTechnicienId())
                    .orElseThrow(() -> new RuntimeException("Technicien non trouvé"));
            existing.setTechnicien(technicien);
        }

        existing.setMateriel(materiel);
        existing.setDeclarant(declarant);
        existing.setDescription(ticket.getDescription());
        existing.setPriorite(ticket.getPriorite());

        // Nouveau bloc pour gérer le changement de statut
        if (ticket.getStatut() != null && ticket.getStatut() == Ticket.StatutTicket.RESOLU) {
            existing.setStatut(Ticket.StatutTicket.RESOLU);
            existing.setDateResolution(LocalDateTime.now());

            
        }

        return ticketRepository.save(existing);
    }


    @Override
    public void deleteTicket(Long id) {
        ticketRepository.deleteById(id);
    }

    @Override
    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
    }

    @Override
    public List<TicketDto> getAllTickets() {
        List<Ticket> tickets = ticketRepository.findAll();

        return tickets.stream().map(ticket -> {
            TicketDto dto = new TicketDto();
            dto.setId(ticket.getId());
            dto.setDescription(ticket.getDescription());
            dto.setDateCreation(ticket.getDateCreation());
            dto.setDateResolution(ticket.getDateResolution());
            dto.setPriorite(ticket.getPriorite());
            dto.setStatut(ticket.getStatut());
            dto.setMaterielId(ticket.getMateriel() != null ? ticket.getMateriel().getId() : null);
            dto.setDeclarantId(ticket.getDeclarant() != null ? ticket.getDeclarant().getId() : null);
            dto.setTechnicienId(ticket.getTechnicien() != null ? ticket.getTechnicien().getId() : null);
            return dto;
        }).collect(Collectors.toList());
    }


    @Override
    public List<Ticket> getTicketsByStatut(Ticket.StatutTicket statut) {
        return ticketRepository.findByStatut(statut);
    }

    @Override
    public List<Ticket> getTicketsByPriorite(Ticket.Priorite priorite) {
        return ticketRepository.findByPriorite(priorite);
    }

    @Override
    public List<Ticket> getTicketsByMateriel(Long materielId) {
        return null;
    }

    @Override
    public List<Ticket> getTicketsByDeclarant(Long declarantId) {
        Utilisateur declarant = utilisateurRepository.findById(declarantId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return ticketRepository.findByDeclarant(declarant);
    }

    @Override
    public List<Ticket> getTicketsByTechnicien(Long technicienId) {
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien non trouvé"));
        return ticketRepository.findByTechnicien(technicien);
    }

    @Override
    public List<Ticket> getTicketsBetweenDates(LocalDateTime start, LocalDateTime end) {
        return ticketRepository.findByDateCreationBetween(start, end);
    }

    @Override
    public Ticket assignTechnicien(Long ticketId, Long technicienId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
        
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien non trouvé"));
        
        ticket.setTechnicien(technicien);
        ticket.setStatut(Ticket.StatutTicket.EN_COURS);
        
        return ticketRepository.save(ticket);
    }

    @Override
    public Ticket updateStatut(Long ticketId, Ticket.StatutTicket statut) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
        
        ticket.setStatut(statut);
        
        if (statut == Ticket.StatutTicket.RESOLU) {
            ticket.setDateResolution(LocalDateTime.now());
            String titre = "Ticket résolu"; 
         
        }
        
        return ticketRepository.save(ticket);
    }
}