package Pfe.T360.service.impl;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Ticket;
import Pfe.T360.entity.Affectation;

@Service
public class RapportServiceImpl {
    
    // Constantes améliorées
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final float MARGIN = 50;
    private static final float LINE_HEIGHT = 18f;
    private static final float TITLE_FONT_SIZE = 16f;
    private static final float SUBTITLE_FONT_SIZE = 14f;
    private static final float BODY_FONT_SIZE = 12f;
    private static final float FOOTER_FONT_SIZE = 10f;
    private static final float TABLE_ROW_HEIGHT = 25f;
    
    // Taille du logo augmentée
    private static final float LOGO_WIDTH = 200;
    private static final float LOGO_HEIGHT = 80;
    
    // Couleurs
    private static final Color HEADER_COLOR = new Color(0.9f, 0.9f, 0.9f);
    private static final Color BORDER_COLOR = new Color(0.5f, 0.5f, 0.5f);
    private static final Color TEXT_COLOR = Color.BLACK;
    private static final Color BOX_BACKGROUND = new Color(0.98f, 0.98f, 0.98f);
    
    private int currentPageNumber = 1;
    private PDImageXObject logoImage = null;

    public byte[] genererRapport(Materiel materiel) throws IOException {
        try (PDDocument document = new PDDocument()) {
            loadLogo(document);
            
            PDPage currentPage = new PDPage(PDRectangle.A4);
            document.addPage(currentPage);
            PDPageContentStream content = new PDPageContentStream(document, currentPage);
            
            try {
                float currentY = setupEnhancedPage(document, content, currentPage, currentPageNumber);
                
                ContentResult result = addEnhancedMaterialInfoSection(document, content, currentPage, currentY, materiel);
                content = result.content;
                currentPage = result.page;
                currentY = result.y;
                
                result = addEnhancedAffectationHistorySection(document, content, currentPage, currentY, materiel);
                content = result.content;
                currentPage = result.page;
                currentY = result.y;
                
                result = addEnhancedTicketsSection(document, content, currentPage, currentY, materiel);
                content = result.content;
                currentPage = result.page;
                currentY = result.y;
                
                addFooter(content, currentPage);
                
            } finally {
                if (content != null) {
                    content.close();
                }
            }
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }
    
    private void loadLogo(PDDocument document) {
        try {
            String[] logoFiles = {"logo.png", "logo.jpg", "images/logo.png"};
            
            for (String logoFile : logoFiles) {
                try {
                    ClassPathResource logoResource = new ClassPathResource(logoFile);
                    if (logoResource.exists()) {
                        logoImage = PDImageXObject.createFromByteArray(
                            document,
                            logoResource.getInputStream().readAllBytes(),
                            "logo"
                        );
                        System.out.println("Logo chargé: " + logoFile);
                        return;
                    }
                } catch (Exception e) {
                    continue;
                }
            }
            
            System.out.println("Aucun logo trouvé");
            
        } catch (Exception e) {
            System.out.println("Erreur lors du chargement du logo: " + e.getMessage());
            logoImage = null;
        }
    }
    
    private static class ContentResult {
        PDPageContentStream content;
        PDPage page;
        float y;
        
        ContentResult(PDPageContentStream content, PDPage page, float y) {
            this.content = content;
            this.page = page;
            this.y = y;
        }
    }

    private float setupEnhancedPage(PDDocument document, PDPageContentStream content, 
                                  PDPage page, int pageNumber) throws IOException {
        
        // Positionnement du logo en haut à gauche avec taille augmentée
        if (logoImage != null) {
            try {
                // Calculer le ratio pour conserver les proportions
                float ratio = Math.min(
                    LOGO_WIDTH / logoImage.getWidth(),
                    LOGO_HEIGHT / logoImage.getHeight()
                );
                float displayWidth = logoImage.getWidth() * ratio;
                float displayHeight = logoImage.getHeight() * ratio;
                
                content.drawImage(logoImage, MARGIN, PDRectangle.A4.getHeight() - MARGIN - displayHeight, 
                                displayWidth, displayHeight);
            } catch (Exception e) {
                System.out.println("Erreur affichage logo: " + e.getMessage());
            }
        }
        
        // Titre principal centré en haut
        float titleY = PDRectangle.A4.getHeight() - MARGIN - 30;
        drawCenteredText(content, "RAPPORT TECHNIQUE", TITLE_FONT_SIZE + 2, titleY);
        
        // Sous-titre
        float subtitleY = titleY - 25;
        drawCenteredText(content, "Fiche Matériel", TITLE_FONT_SIZE, subtitleY);
        
        // Ligne de séparation
        drawDecorativeLine(content, MARGIN, subtitleY - 20, PDRectangle.A4.getWidth() - 2 * MARGIN);
        
        return subtitleY - 40;
    }

    private ContentResult addEnhancedMaterialInfoSection(PDDocument document, PDPageContentStream content,
                                                       PDPage currentPage, float startY, Materiel materiel) throws IOException {
        float currentY = startY;
        
        if (currentY < MARGIN + 250) {
            content.close();
            currentPage = newPage(document);
            content = new PDPageContentStream(document, currentPage);
            currentY = setupEnhancedPage(document, content, currentPage, ++currentPageNumber);
        }
        
        currentY = drawSectionHeader(content, "INFORMATIONS DU MATERIEL", currentY);
        
        String[][] materielData = {
            {"Marque", materiel.getMarque()},
            {"Modèle", materiel.getModele()},
            {"Numéro Série", materiel.getNumeroSerie()},
            {"Date Achat", formatDate(materiel.getDateAchat())},
            {"Garantie", materiel.getDureeGarantie() + " mois"},
            {"Type", formatEnum(materiel.getType())},
            {"État", formatEnum(materiel.getEtat())}
        };
        
        currentY = drawEnhancedTable(content, MARGIN, currentY, 
                                   new float[]{150, PDRectangle.A4.getWidth() - 2 * MARGIN - 150},
                                   materielData);
        
        return new ContentResult(content, currentPage, currentY - 40);
    }

    private ContentResult addEnhancedAffectationHistorySection(PDDocument document, PDPageContentStream content,
                                                             PDPage currentPage, float startY, Materiel materiel) throws IOException {
        float currentY = startY;
        List<Affectation> affectations = materiel.getAffectations();
        
        if (affectations.isEmpty()) {
            return new ContentResult(content, currentPage, currentY);
        }
        
        if (currentY < MARGIN + 120) {
            content.close();
            currentPage = newPage(document);
            content = new PDPageContentStream(document, currentPage);
            currentY = setupEnhancedPage(document, content, currentPage, ++currentPageNumber);
        }
        
        currentY = drawSectionHeader(content, "HISTORIQUE D'AFFECTATIONS", currentY);
        
        for (int i = 0; i < affectations.size(); i++) {
            Affectation aff = affectations.get(i);
            
            if (currentY < MARGIN + 90) {
                content.close();
                currentPage = newPage(document);
                content = new PDPageContentStream(document, currentPage);
                currentY = setupEnhancedPage(document, content, currentPage, ++currentPageNumber);
                currentY = drawSectionHeader(content, "HISTORIQUE D'AFFECTATIONS (suite)", currentY);
            }
            
            float boxHeight = 70;
            drawStyledBox(content, MARGIN, currentY - boxHeight, 
                         PDRectangle.A4.getWidth() - 2 * MARGIN, boxHeight, BOX_BACKGROUND);
            
            drawText(content, "Affectation #" + (i + 1), BODY_FONT_SIZE + 2, 
                    PDType1Font.HELVETICA_BOLD, MARGIN + 15, currentY - 20);
            
            String utilisateur = aff.getUtilisateur().getNom() + " " + aff.getUtilisateur().getPrenom();
            drawText(content, "Utilisateur: " + utilisateur, BODY_FONT_SIZE, 
                    PDType1Font.HELVETICA, MARGIN + 15, currentY - 40);
            
            String periode = "Période: " + formatDate(aff.getDateDebut()) + " - " + 
                           (aff.getDateFin() != null ? formatDate(aff.getDateFin()) : "En cours");
            drawText(content, periode, BODY_FONT_SIZE, 
                    PDType1Font.HELVETICA, MARGIN + 15, currentY - 55);
            
            currentY -= (boxHeight + 15);
        }
        
        return new ContentResult(content, currentPage, currentY - 20);
    }

    private ContentResult addEnhancedTicketsSection(PDDocument document, PDPageContentStream content,
                                                  PDPage currentPage, float startY, Materiel materiel) throws IOException {
        float currentY = startY;
        List<Ticket> tickets = materiel.getTickets();
        
        if (tickets.isEmpty()) {
            return new ContentResult(content, currentPage, currentY);
        }
        
        if (currentY < MARGIN + 120) {
            content.close();
            currentPage = newPage(document);
            content = new PDPageContentStream(document, currentPage);
            currentY = setupEnhancedPage(document, content, currentPage, ++currentPageNumber);
        }
        
        currentY = drawSectionHeader(content, "TICKETS ASSOCIES", currentY);
        
        for (int i = 0; i < tickets.size(); i++) {
            Ticket ticket = tickets.get(i);
            
            if (currentY < MARGIN + 110) {
                content.close();
                currentPage = newPage(document);
                content = new PDPageContentStream(document, currentPage);
                currentY = setupEnhancedPage(document, content, currentPage, ++currentPageNumber);
                currentY = drawSectionHeader(content, "TICKETS ASSOCIES (suite)", currentY);
            }
            
            float boxHeight = 90;
            Color statusColor = getStatusColor(ticket.getStatut());
            drawStyledBox(content, MARGIN, currentY - boxHeight, 
                         PDRectangle.A4.getWidth() - 2 * MARGIN, boxHeight, statusColor);
            
            drawText(content, "Ticket #" + (i + 1) + " - " + formatEnum(ticket.getStatut()), 
                    BODY_FONT_SIZE + 2, PDType1Font.HELVETICA_BOLD, 
                    MARGIN + 15, currentY - 20);
            
            drawText(content, "Date: " + formatDate(ticket.getDateCreation()), BODY_FONT_SIZE, 
                    PDType1Font.HELVETICA, MARGIN + 15, currentY - 40);
            
            drawText(content, "Déclarant: " + ticket.getDeclarant().getNom() + " " + 
                    ticket.getDeclarant().getPrenom(), BODY_FONT_SIZE, 
                    PDType1Font.HELVETICA, MARGIN + 15, currentY - 55);
            
            drawWrappedTextInBox(content, "Description: " + cleanText(ticket.getDescription()),
                               MARGIN + 15, currentY - 75, 
                               PDRectangle.A4.getWidth() - 2 * MARGIN - 30, BODY_FONT_SIZE);
            
            currentY -= (boxHeight + 15);
        }
        
        return new ContentResult(content, currentPage, currentY);
    }

    // Méthodes utilitaires
    
    private void drawCenteredText(PDPageContentStream content, String text, 
                                float fontSize, float y) throws IOException {
        float titleWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(text) / 1000 * fontSize;
        float x = (PDRectangle.A4.getWidth() - titleWidth) / 2;
        drawText(content, text, fontSize, PDType1Font.HELVETICA_BOLD, x, y);
    }
    
    private float drawSectionHeader(PDPageContentStream content, String title, float y) throws IOException {
        drawColoredRectangle(content, MARGIN - 10, y - 25, 
                           PDRectangle.A4.getWidth() - 2 * MARGIN + 20, 30, HEADER_COLOR);
        
        drawText(content, title, SUBTITLE_FONT_SIZE, 
                PDType1Font.HELVETICA_BOLD, MARGIN, y - 15);
        
        return y - 45;
    }
    
    private void drawColoredRectangle(PDPageContentStream content, float x, float y, 
                                    float width, float height, Color color) throws IOException {
        content.setNonStrokingColor(color);
        content.addRect(x, y, width, height);
        content.fill();
        content.setNonStrokingColor(TEXT_COLOR);
    }
    
    private void drawStyledBox(PDPageContentStream content, float x, float y, 
                             float width, float height, Color backgroundColor) throws IOException {
        content.setNonStrokingColor(backgroundColor);
        content.addRect(x, y, width, height);
        content.fill();
        
        content.setStrokingColor(BORDER_COLOR);
        content.setLineWidth(1.5f);
        content.addRect(x, y, width, height);
        content.stroke();
        
        content.setNonStrokingColor(TEXT_COLOR);
        content.setStrokingColor(TEXT_COLOR);
    }
    
    private float drawEnhancedTable(PDPageContentStream content, float x, float y,
                                  float[] columnWidths, String[][] data) throws IOException {
        float currentY = y;
        
        for (int i = 0; i < data.length; i++) {
            boolean isHeader = (i == 0);
            
            if (isHeader) {
                drawColoredRectangle(content, x, currentY - TABLE_ROW_HEIGHT, 
                                   columnWidths[0] + columnWidths[1], TABLE_ROW_HEIGHT, HEADER_COLOR);
            }
            
            content.setStrokingColor(BORDER_COLOR);
            content.setLineWidth(1f);
            content.addRect(x, currentY - TABLE_ROW_HEIGHT, 
                          columnWidths[0] + columnWidths[1], TABLE_ROW_HEIGHT);
            content.stroke();
            
            content.moveTo(x + columnWidths[0], currentY);
            content.lineTo(x + columnWidths[0], currentY - TABLE_ROW_HEIGHT);
            content.stroke();
            
            PDType1Font font = isHeader ? PDType1Font.HELVETICA_BOLD : PDType1Font.HELVETICA;
            float textY = currentY - (TABLE_ROW_HEIGHT / 2) - (BODY_FONT_SIZE / 3);
            
            for (int j = 0; j < data[i].length && j < 2; j++) {
                float textX = x + (j == 0 ? 10 : columnWidths[0] + 10);
                String cellText = data[i][j] != null ? cleanText(data[i][j]) : "";
                drawText(content, cellText, BODY_FONT_SIZE, font, textX, textY);
            }
            
            currentY -= TABLE_ROW_HEIGHT;
        }
        
        return currentY;
    }
    
    private void drawDecorativeLine(PDPageContentStream content, float x, float y, float width) throws IOException {
        content.setStrokingColor(new Color(0, 100, 180));
        content.setLineWidth(2f);
        content.moveTo(x, y);
        content.lineTo(x + width, y);
        content.stroke();
        content.setStrokingColor(TEXT_COLOR);
    }
    
    private String cleanText(String text) {
        if (text == null) return "";
        return text.replace("→", "->")
                  .replace("←", "<-")
                  .replace("•", "-")
                  .replace("–", "-")
                  .replace("—", "-")
                  .replace("…", "...");
    }
    
    private Color getStatusColor(Object statut) {
        if (statut == null) return new Color(0.95f, 0.95f, 0.95f);
        
        String statutStr = statut.toString().toLowerCase();
        
        switch (statutStr) {
            case "ouvert": return new Color(1.0f, 0.9f, 0.9f);
            case "en_cours": return new Color(1.0f, 1.0f, 0.8f);
            case "resolu": return new Color(0.9f, 1.0f, 0.9f);
            default: return new Color(0.95f, 0.95f, 0.95f);
        }
    }
    
    private String formatEnum(Object enumValue) {
        if (enumValue == null) return "N/A";
        return enumValue.toString().replace("_", " ").toLowerCase();
    }
    
    private String formatDate(Object date) {
        if (date == null) return "N/A";
        if (date instanceof LocalDate) {
            return ((LocalDate) date).format(DATE_FORMATTER);
        }
        return date.toString();
    }
    
    private void addFooter(PDPageContentStream content, PDPage page) throws IOException {
        drawDecorativeLine(content, MARGIN, 50, PDRectangle.A4.getWidth() - 2 * MARGIN);
        
        String footerText = "Page " + currentPageNumber;
        drawText(content, footerText, FOOTER_FONT_SIZE, 
                PDType1Font.HELVETICA, MARGIN, 35);
        
        String timestamp = "Généré le " + LocalDate.now().format(DATE_FORMATTER);
        float timestampWidth = PDType1Font.HELVETICA.getStringWidth(timestamp) / 1000 * FOOTER_FONT_SIZE;
        drawText(content, timestamp, FOOTER_FONT_SIZE, 
                PDType1Font.HELVETICA, 
                PDRectangle.A4.getWidth() - MARGIN - timestampWidth, 35);
    }
    
    private PDPage newPage(PDDocument document) {
        PDPage newPage = new PDPage(PDRectangle.A4);
        document.addPage(newPage);
        return newPage;
    }
    
    private void drawText(PDPageContentStream content, String text, float fontSize, 
                         PDType1Font font, float x, float y) throws IOException {
        content.beginText();
        content.setFont(font, fontSize);
        content.newLineAtOffset(x, y);
        content.showText(cleanText(text != null ? text : ""));
        content.endText();
    }
    
    private void drawWrappedTextInBox(PDPageContentStream content, String text, float x, float y, 
                                    float maxWidth, float fontSize) throws IOException {
        if (text == null || text.isEmpty()) return;
        
        text = cleanText(text);
        
        content.beginText();
        content.setFont(PDType1Font.HELVETICA, fontSize);
        content.newLineAtOffset(x, y);
        
        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();
        
        for (String word : words) {
            String testLine = line.length() > 0 ? line + " " + word : word;
            float testWidth = PDType1Font.HELVETICA.getStringWidth(testLine) / 1000 * fontSize;
            
            if (testWidth < maxWidth) {
                line = new StringBuilder(testLine);
            } else {
                if (line.length() > 0) {
                    content.showText(line.toString());
                    content.newLineAtOffset(0, -LINE_HEIGHT);
                    line = new StringBuilder(word);
                } else {
                    content.showText(word);
                    content.newLineAtOffset(0, -LINE_HEIGHT);
                }
            }
        }
        
        if (line.length() > 0) {
            content.showText(line.toString());
        }
        
        content.endText();
    }
}