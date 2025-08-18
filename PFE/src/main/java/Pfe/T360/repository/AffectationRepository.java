package Pfe.T360.repository;

import Pfe.T360.entity.Affectation;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AffectationRepository extends JpaRepository<Affectation, Long> {

	Optional<Affectation> findByMaterielAndDateFinIsNull(Materiel materiel);

	List<Affectation> findByUtilisateur(Utilisateur utilisateur);

	List<Affectation> findByMateriel(Materiel materiel);

	@Query("SELECT a FROM Affectation a WHERE a.dateFin IS NULL")
	List<Affectation> findByDateFinIsNull();

	@Query("SELECT a FROM Affectation a WHERE a.dateDebut BETWEEN :start AND :end OR a.dateFin BETWEEN :start AND :end")
	List<Affectation> findByDateDebutBetweenOrDateFinBetween(
			@Param("start") LocalDate start, 
			@Param("end") LocalDate end);

	@Query("SELECT a FROM Affectation a WHERE a.dateDebut <= :date AND (a.dateFin IS NULL OR a.dateFin >= :date)")
	List<Affectation> findAffectationsActivesALaDate(@Param("date") LocalDate date);

	@Query("SELECT a FROM Affectation a WHERE a.utilisateur = :utilisateur AND a.dateFin IS NULL")
	List<Affectation> findAffectationsActivesParUtilisateur(@Param("utilisateur") Utilisateur utilisateur);

	@Query("SELECT COUNT(a) FROM Affectation a WHERE a.materiel = :materiel AND a.dateFin IS NULL")
	long countAffectationsActivesPourMateriel(@Param("materiel") Materiel materiel);
	@Query("""
			SELECT m.etat, COUNT(m)
			FROM Affectation a
			JOIN a.materiel m
			WHERE a.utilisateur.id = :userId AND a.dateFin IS NULL
			GROUP BY m.etat
			""")
	List<Object[]> countMaterielsByEtatForUser(@Param("userId") Long userId);
	@Query("SELECT a.materiel FROM Affectation a WHERE a.utilisateur.id = :userId AND a.dateFin IS NULL")
	List<Materiel> findMaterielsActifsParUtilisateur(@Param("userId") Long userId);
	List<Affectation> findByMaterielAndStatut(Materiel materiel, Affectation.StatutAffectation statut);
	boolean existsByMaterielAndStatut(Materiel materiel, Affectation.StatutAffectation statut);
    

}