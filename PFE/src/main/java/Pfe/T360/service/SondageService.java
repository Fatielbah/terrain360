package Pfe.T360.service;

import Pfe.T360.dto.SondageDTO;
import Pfe.T360.dto.SondageUpdateDTO;
import Pfe.T360.entity.Sondage;
import Pfe.T360.entity.Vote;


import java.util.List;

public interface SondageService {
    Sondage createSondage(Sondage sondage);
    List<SondageDTO> getAllSondages();
    Sondage getSondageById(Long id);
    SondageDTO updateSondage(Long id, SondageUpdateDTO sondageUpdateDTO);
    void deleteSondage(Long id);
    Vote voterOption(Long optionId, Long utilisateurId);
}
