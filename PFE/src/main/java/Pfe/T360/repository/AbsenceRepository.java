package Pfe.T360.repository;

import Pfe.T360.entity.Absence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AbsenceRepository extends JpaRepository<Absence, Long> {
	List<Absence> findByUtilisateurId(Long utilisateurId);
}
