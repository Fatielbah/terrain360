package Pfe.T360.controller;

import Pfe.T360.entity.Vue;
import Pfe.T360.service.VueService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vues")
public class VueController {

    private final VueService vueService;

    public VueController(VueService vueService) {
        this.vueService = vueService;
    }

    @PostMapping("/{postId}/utilisateur/{utilisateurId}")
    public Vue addVue(@PathVariable Long postId, @PathVariable Long utilisateurId) {
        return vueService.addVue(postId, utilisateurId);
    }

    @GetMapping("/post/{postId}")
    public List<Vue> getVues(@PathVariable Long postId) {
        return vueService.getVuesByPost(postId);
    }
}
