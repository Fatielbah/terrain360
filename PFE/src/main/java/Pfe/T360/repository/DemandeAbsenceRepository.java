package Pfe.T360.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import Pfe.T360.entity.Demande.StatutDemande;
import Pfe.T360.entity.DemandeAbsence;
import Pfe.T360.entity.DemandeAbsence.TypeAbsence;
@Repository
public interface DemandeAbsenceRepository extends JpaRepository<DemandeAbsence, Long> {
	 List<DemandeAbsence> findByUtilisateurId(Long userId);
    
    List<DemandeAbsence> findByTypeAndEstUrgente(TypeAbsence type, boolean estUrgente);
    
    List<DemandeAbsence> findByUtilisateurIdAndStatut(Long userId, StatutDemande statut);
}