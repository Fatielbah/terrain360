package Pfe.T360.repository;

import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Ticket;
import Pfe.T360.entity.Ticket.Priorite;
import Pfe.T360.entity.Ticket.StatutTicket;
import Pfe.T360.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    List<Ticket> findByMateriel(Materiel materiel);
    
    List<Ticket> findByDeclarant(Utilisateur declarant);
    
    List<Ticket> findByTechnicien(Utilisateur technicien);
    
    List<Ticket> findByStatut(StatutTicket statut);
    
    List<Ticket> findByPriorite(Priorite priorite);
    
    List<Ticket> findByDateCreationBetween(LocalDateTime start, LocalDateTime end);
    @Query("SELECT t FROM Ticket t WHERE t.materiel = :materiel AND t.statut <> Pfe.T360.entity.Ticket.StatutTicket.RESOLU")
    List<Ticket> findTicketsNonResolusPourMateriel(@Param("materiel") Materiel materiel);

    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.materiel = :materiel")
    long countTicketsByMateriel(@Param("materiel") Materiel materiel);
    
    long countByStatutIn(List<Ticket.StatutTicket> statuts);

}