package Pfe.T360.service;

import Pfe.T360.dto.MaterielDTO;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Materiel.EtatMateriel;
import Pfe.T360.entity.Materiel.TypeMateriel;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface MaterielService {
    Materiel createMateriel(MaterielDTO materiel);
    Materiel updateMateriel(Long id, MaterielDTO materiel);
    void deleteMateriel(Long id);
    Materiel getMaterielById(Long id);
    Materiel getMaterielByNumeroSerie(String numeroSerie);
    List<Materiel> getAllMateriels();
    List<Materiel> getMaterielsByType(TypeMateriel type);
    List<Materiel> getMaterielsByEtat(EtatMateriel etat);
    List<Materiel> getMaterielsDisponibles();
    List<Materiel> getMaterielsAffectes();
    List<Materiel> getMaterielsSousGarantie(LocalDate date);
    Materiel updateEtatMateriel(Long id, EtatMateriel nouvelEtat);
    Map<String, Long> getMaterielStatistics();
    long countMaterielsAffectesAUser(Long userId);
}