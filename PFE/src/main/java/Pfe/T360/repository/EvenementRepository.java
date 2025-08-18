package Pfe.T360.repository;



import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import Pfe.T360.entity.Evenement;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {
	List<Evenement> findByCreateurId(Long createurId);
	@Query("SELECT DISTINCT e FROM Evenement e " +
	           "LEFT JOIN FETCH e.rappel r " +
	           "LEFT JOIN FETCH e.invitations i " +
	           "LEFT JOIN FETCH e.createur c " +  // Ajout explicite du fetch pour createur
	           "WHERE r.envoye = false " +
	           "AND e.date >= CURRENT_DATE")
	    List<Evenement> findAllWithRappelNonEnvoye();
}
