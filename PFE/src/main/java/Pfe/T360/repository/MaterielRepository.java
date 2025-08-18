package Pfe.T360.repository;

import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Materiel.EtatMateriel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaterielRepository extends JpaRepository<Materiel, Long> {
    
    Optional<Materiel> findByNumeroSerie(String numeroSerie);
    
    List<Materiel> findByMarque(String marque);
    
    List<Materiel> findByType(Materiel.TypeMateriel type);
    
    List<Materiel> findByEtat(EtatMateriel etat);
    
    // Replace countByAffectationActive_Utilisateur_Id with:
    @Query("SELECT COUNT(DISTINCT m) FROM Materiel m JOIN m.affectations a " +
           "WHERE a.statut = 'ACTIVE' AND a.utilisateur.id = :userId")
    long countByUserWithActiveAffectation(@Param("userId") Long userId);

    // Replace findByAffectationActive_Utilisateur_Id with:
    @Query("SELECT DISTINCT m FROM Materiel m JOIN m.affectations a " +
           "WHERE a.statut = 'ACTIVE' AND a.utilisateur.id = :userId")
    List<Materiel> findByUserWithActiveAffectation(@Param("userId") Long userId);

    // Replace findMaterielsAffectes with:
    @Query("SELECT DISTINCT m FROM Materiel m JOIN m.affectations a WHERE a.statut = 'ACTIVE'")
    List<Materiel> findMaterielsAffectes();
    
    // Replace findMaterielsDisponibles with:
    @Query("SELECT m FROM Materiel m WHERE NOT EXISTS " +
           "(SELECT 1 FROM Affectation a WHERE a.materiel = m AND a.statut = 'ACTIVE')")
    List<Materiel> findMaterielsDisponibles();
    
    @Query(value = "SELECT * FROM materiel m WHERE m.duree_garantie IS NOT NULL AND DATE_ADD(m.date_achat, INTERVAL m.duree_garantie MONTH) >= :date", nativeQuery = true)
    List<Materiel> findMaterielsSousGarantie(@Param("date") LocalDate date);
    
    long countByEtat(EtatMateriel etat);
    boolean existsByNumeroSerie(String numeroSerie);

}