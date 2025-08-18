package Pfe.T360.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import Pfe.T360.entity.Demande;
import Pfe.T360.entity.Demande.StatutDemande;
import Pfe.T360.entity.Role;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DemandeRepository extends JpaRepository<Demande, Long> {
    
    List<Demande> findByUtilisateurId(Long utilisateurId);
    
    List<Demande> findByStatut(StatutDemande statut);
    
    @Query("SELECT d FROM Demande d WHERE d.dateDebut BETWEEN ?1 AND ?2 OR d.dateFin BETWEEN ?1 AND ?2")
    List<Demande> findBetweenDates(LocalDate start, LocalDate end);
    
    List<Demande> findByUtilisateurRole(Role role);
}
