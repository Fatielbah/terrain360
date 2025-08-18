package Pfe.T360.service;

import java.util.List;

import Pfe.T360.dto.FicheDePosteDto;
import Pfe.T360.entity.FicheDePoste;


public interface FicheDePosteService {

    public FicheDePoste creerFiche(FicheDePosteDto fiche);

    public List<FicheDePosteDto> listerFiches() ;
    void deleteFiche(Long id);
    FicheDePoste updateFiche(Long id, FicheDePosteDto ficheDto);
    FicheDePosteDto getFicheById(Long id); 
}