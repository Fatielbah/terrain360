package Pfe.T360.service;
import java.util.List;
import java.util.Optional;

import Pfe.T360.dto.EvenementDto;
import Pfe.T360.entity.Evenement;

public interface EvenementService {

	    Evenement createEvenement(Evenement evenement, Long createurId);

	    List<EvenementDto> getAllEvenements();

	    Optional<Evenement> getEvenementById(Long id);

	    List<Evenement> getEvenementsByCreateurId(Long createurId);

	    Evenement updateEvenement(Long id, Evenement evenement);

	    void deleteEvenement(Long id);
	

}
