package Pfe.T360.service.impl;

import java.util.Map;
import Pfe.T360.entity.Conge;
import org.springframework.stereotype.Service;
import Pfe.T360.entity.Absence;
import Pfe.T360.repository.CongeRepository;
import Pfe.T360.service.UtilisateurAbsenceCongeService;
import lombok.RequiredArgsConstructor;
import Pfe.T360.repository.AbsenceRepository;

import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UtilisateurAbsenceCongeServiceImpl implements UtilisateurAbsenceCongeService {
	private final AbsenceRepository absenceRepository;
	private final CongeRepository congeRepository;

	@Override
	public Map<String, Object> getAbsencesEtCongesParUtilisateur(Long utilisateurId) {
		List<Absence> absences = absenceRepository.findByUtilisateurId(utilisateurId);
		List<Conge> conges = congeRepository.findByUtilisateurId(utilisateurId);

		Map<String, Object> result = new HashMap<>();
		result.put("absences", absences);
		result.put("conges", conges);

		return result;
	}
}