package Pfe.T360.repository;

import Pfe.T360.entity.Affectation;
import Pfe.T360.entity.HistoriqueAffectation;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.awt.print.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HistoriqueAffectationRepository extends JpaRepository<HistoriqueAffectation, Long> {

	List<HistoriqueAffectation> findByMaterielOrderByDateDebutDesc(Materiel materiel);

	List<HistoriqueAffectation> findByUtilisateurOrderByDateDebutDesc(Utilisateur utilisateur);

	@Query("SELECT h FROM HistoriqueAffectation h ORDER BY h.dateDebut DESC")
	List<HistoriqueAffectation> findAllByOrderByDateDebutDesc();

	@Query("SELECT h FROM HistoriqueAffectation h WHERE h.dateFin IS NULL")
	List<HistoriqueAffectation> findByDateFinIsNull();

	Optional<HistoriqueAffectation> findByAffectation(Affectation affectation);
	List<HistoriqueAffectation> findByMateriel_Id(Long materielId);
	// In HistoriqueAffectationRepository
	@Query("SELECT DISTINCT h FROM HistoriqueAffectation h WHERE h.materiel.id = :materielId ORDER BY h.dateDebut DESC")
    List<HistoriqueAffectation> findByMaterielIdOrderByDateDebutDesc(@Param("materielId") Long materielId);
	@Query(value = """
    SELECT DISTINCT h.* FROM historique_affectation h 
    WHERE h.materiel_id = :materielId 
    ORDER BY h.date_debut DESC
    """, nativeQuery = true)
List<HistoriqueAffectation> findHistoriqueByMaterielId(@Param("materielId") Long materielId);
	 List<HistoriqueAffectation> findByMateriel(Materiel materiel);
	}