package Pfe.T360.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import Pfe.T360.entity.DemandeDocument;
import Pfe.T360.entity.DemandeDocument.TypeDocument;
import java.util.List;


@Repository
public interface DemandeDocumentRepository extends JpaRepository<DemandeDocument, Long> {
	List<DemandeDocument> findByUtilisateurId(Long userId);
    
    List<DemandeDocument> findByType(TypeDocument type);
    
    List<DemandeDocument> findByUtilisateurIdAndDateDemandeBetween(Long userId, LocalDate start, LocalDate end);
}