package com.carhub.booking;

import com.carhub.packagecatalog.TravelPackage;
import com.carhub.provider.ProviderProfile;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

@Service
public class TicketPdfService {
    private static final Color RED = new Color(229, 9, 20);
    private static final Color TEXT = new Color(31, 41, 55);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Color BORDER = new Color(226, 232, 240);

    public byte[] generate(Ticket ticket) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 42, 42, 42, 42);
        PdfWriter.getInstance(document, output);
        document.open();

        Font brandFont = new Font(Font.HELVETICA, 22, Font.BOLD, RED);
        Font titleFont = new Font(Font.HELVETICA, 17, Font.BOLD, TEXT);
        Font labelFont = new Font(Font.HELVETICA, 9, Font.BOLD, MUTED);
        Font valueFont = new Font(Font.HELVETICA, 11, Font.NORMAL, TEXT);
        Font strongFont = new Font(Font.HELVETICA, 11, Font.BOLD, TEXT);

        Paragraph brand = new Paragraph("CARHUB", brandFont);
        brand.setAlignment(Element.ALIGN_LEFT);
        document.add(brand);
        document.add(new Paragraph("Payment confirmed travel ticket", new Font(Font.HELVETICA, 10, Font.NORMAL, MUTED)));
        document.add(Chunk.NEWLINE);

        TravelPackage pack = ticket.getTravelPackage();
        ProviderProfile provider = ticket.getProvider();

        PdfPTable header = new PdfPTable(new float[] { 2.2f, 1f });
        header.setWidthPercentage(100);
        header.addCell(cell("Package", pack.getTitle(), labelFont, titleFont));
        header.addCell(cell("Ticket number", ticket.getTicketNumber(), labelFont, strongFont));
        header.addCell(cell("Destination", pack.getDestination(), labelFont, valueFont));
        header.addCell(cell("Status", ticket.getStatus().name(), labelFont, strongFont));
        document.add(header);
        document.add(Chunk.NEWLINE);

        PdfPTable trip = new PdfPTable(new float[] { 1f, 1f, 1f });
        trip.setWidthPercentage(100);
        trip.addCell(cell("Pickup date", ticket.getPickupDate() == null ? "Pending" : ticket.getPickupDate().toString(), labelFont, valueFont));
        trip.addCell(cell("Pickup time", ticket.getPickupTime() == null ? "Pending" : ticket.getPickupTime(), labelFont, valueFont));
        trip.addCell(cell("Travellers", String.valueOf(ticket.getTravellersCount()), labelFont, valueFont));
        trip.addCell(cell("Pickup point", nullSafe(ticket.getPickupLocation(), "Pending"), labelFont, valueFont));
        trip.addCell(cell("Route", pack.getDestination(), labelFont, valueFont));
        trip.addCell(cell("Car type", ticket.getCarType().name().replace("_", " "), labelFont, valueFont));
        document.add(trip);
        document.add(Chunk.NEWLINE);

        PdfPTable providerTable = new PdfPTable(new float[] { 1f, 1f });
        providerTable.setWidthPercentage(100);
        providerTable.addCell(cell("Provider", provider.getBusinessName(), labelFont, valueFont));
        providerTable.addCell(cell("Provider contact", nullSafe(ticket.getProviderMobileSnapshot(), provider.getUser().getMobile()), labelFont, valueFont));
        providerTable.addCell(cell("Vehicle", carDetails(ticket), labelFont, valueFont));
        providerTable.addCell(cell("Payment reference", nullSafe(ticket.getPaymentReference(), "Confirmed"), labelFont, valueFont));
        document.add(providerTable);

        if (ticket.getSpecialRequests() != null && !ticket.getSpecialRequests().isBlank()) {
            document.add(Chunk.NEWLINE);
            document.add(new Paragraph("Special request", labelFont));
            document.add(new Paragraph(ticket.getSpecialRequests(), valueFont));
        }

        document.add(Chunk.NEWLINE);
        Paragraph note = new Paragraph("Please keep this ticket available during pickup. Provider details are shared for your confirmed booking only.", new Font(Font.HELVETICA, 9, Font.NORMAL, MUTED));
        note.setSpacingBefore(16);
        document.add(note);

        document.close();
        return output.toByteArray();
    }

    private PdfPCell cell(String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(12);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(BORDER);
        cell.addElement(new Phrase(label.toUpperCase(), labelFont));
        cell.addElement(new Phrase(nullSafe(value, "Not available"), valueFont));
        return cell;
    }

    private String carDetails(Ticket ticket) {
        if (ticket.getCarModel() != null && !ticket.getCarModel().isBlank()) {
            return String.join(" - ", java.util.stream.Stream.of(ticket.getCarModel(), ticket.getCarNumber(), ticket.getCarColor())
                    .filter(value -> value != null && !value.isBlank())
                    .toList());
        }
        return ticket.getCarType() == CarType.FOUR_SEATER ? "4-seater private car" : "6-seater private car";
    }

    private String nullSafe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
