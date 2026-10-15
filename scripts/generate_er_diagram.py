"""
Generate high-resolution academic ER Diagram for Campus Laundry Slot Booking and Billing System
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_er_diagram(output_path="docs/images/er_diagram.png"):
    fig, ax = plt.subplots(figsize=(14, 9), dpi=300)
    ax.set_xlim(0, 140)
    ax.set_ylim(0, 95)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    # Title
    ax.text(70, 92, "ENTITY-RELATIONSHIP (ER) DIAGRAM", 
            fontsize=16, fontweight='bold', ha='center', va='center', color='#0F172A', fontfamily='serif')
    ax.text(70, 89, "Campus Laundry Slot Booking and Billing System (MySQL 8.0 - 3NF Schema)", 
            fontsize=10.5, fontstyle='italic', ha='center', va='center', color='#475569', fontfamily='serif')

    # Helper function to draw table entity
    def draw_entity(x, y, w, h, title, fields, bg_color="#F8FAFC", header_color="#1E3A8A"):
        # Header rect
        hh = 4.2
        header = patches.FancyBboxPatch((x, y + h - hh), w, hh, boxstyle="round,pad=0.2,rounding_size=1.0",
                                        facecolor=header_color, edgecolor=header_color, linewidth=1.2)
        ax.add_patch(header)
        ax.text(x + w / 2, y + h - hh / 2, title, fontsize=10, fontweight='bold', 
                ha='center', va='center', color='#FFFFFF', fontfamily='sans-serif')

        # Body rect
        body = patches.FancyBboxPatch((x, y), w, h - hh, boxstyle="round,pad=0.2,rounding_size=1.0",
                                      facecolor=bg_color, edgecolor="#64748B", linewidth=1.2)
        ax.add_patch(body)

        # Fields
        cur_y = y + h - hh - 2.0
        line_spacing = (h - hh - 2.5) / max(len(fields), 1)
        for field, ftype, is_pk, is_fk, is_uq in fields:
            prefix = ""
            color = "#0F172A"
            tag = ""
            if is_pk:
                prefix = "PK "
                tag = "[PK]"
                color = "#991B1B"
            elif is_fk:
                prefix = "FK "
                tag = "[FK]"
                color = "#075985"
            elif is_uq:
                tag = "[UQ]"
                color = "#065F46"

            ax.text(x + 1.2, cur_y, f"{tag} {field}", fontsize=7.5, fontweight='bold' if is_pk else 'normal',
                    va='center', color=color, fontfamily='monospace')
            ax.text(x + w - 1.2, cur_y, ftype, fontsize=7, fontstyle='italic',
                    ha='right', va='center', color="#475569", fontfamily='monospace')
            cur_y -= line_spacing

    # Entity definitions
    # 1. STUDENTS (Top Left)
    draw_entity(8, 55, 34, 28, "STUDENTS", [
        ("student_id", "INT", True, False, False),
        ("name", "VARCHAR(100)", False, False, False),
        ("register_no", "VARCHAR(50)", False, False, True),
        ("phone", "VARCHAR(20)", False, False, False),
        ("email", "VARCHAR(100)", False, False, True),
        ("password", "VARCHAR(255)", False, False, False),
        ("room_no", "VARCHAR(20)", False, False, False),
        ("created_at", "TIMESTAMP", False, False, False),
    ], header_color="#1E40AF")

    # 2. SLOTS (Bottom Left)
    draw_entity(8, 12, 34, 28, "SLOTS", [
        ("slot_id", "INT", True, False, False),
        ("slot_date", "DATE", False, False, False),
        ("start_time", "TIME", False, False, False),
        ("end_time", "TIME", False, False, False),
        ("capacity", "INT (CHECK > 0)", False, False, False),
        ("status", "ENUM('Avail','Full')", False, False, False),
        ("created_at", "TIMESTAMP", False, False, False),
        ("uq_interval", "UNIQUE(date,time)", False, False, True),
    ], header_color="#0D9488")

    # 3. BOOKINGS (Center)
    draw_entity(53, 33, 34, 34, "BOOKINGS", [
        ("booking_id", "INT", True, False, False),
        ("student_id", "INT", False, True, False),
        ("slot_id", "INT", False, True, False),
        ("booking_date", "TIMESTAMP", False, False, False),
        ("status", "ENUM(Pending...)", False, False, False),
        ("total_amount", "DECIMAL(10,2)", False, False, False),
        ("pickup_code", "VARCHAR(20)", False, False, True),
        ("notes", "TEXT", False, False, False),
    ], header_color="#4338CA")

    # 4. BOOKING_ITEMS (Center Right)
    draw_entity(98, 52, 34, 27, "BOOKING_ITEMS", [
        ("item_id", "INT", True, False, False),
        ("booking_id", "INT", False, True, False),
        ("service_id", "INT", False, True, False),
        ("quantity", "INT (CHECK > 0)", False, False, False),
        ("unit_price", "DECIMAL(10,2)", False, False, False),
        ("line_total", "DECIMAL(10,2)", False, False, False),
    ], header_color="#D97706")

    # 5. SERVICES (Top Right)
    draw_entity(98, 12, 34, 28, "SERVICES", [
        ("service_id", "INT", True, False, False),
        ("service_name", "VARCHAR(100)", False, False, True),
        ("unit_price", "DECIMAL(10,2)", False, False, False),
        ("turnaround_days", "INT", False, False, False),
        ("description", "VARCHAR(255)", False, False, False),
        ("category", "VARCHAR(50)", False, False, False),
        ("unit_type", "VARCHAR(20)", False, False, False),
        ("is_active", "BOOLEAN", False, False, False),
    ], header_color="#059669")

    # 6. PAYMENTS (Bottom Center)
    draw_entity(53, 2, 34, 22, "PAYMENTS", [
        ("payment_id", "INT", True, False, False),
        ("booking_id", "INT", False, True, False),
        ("paid_amount", "DECIMAL(10,2)", False, False, False),
        ("payment_date", "TIMESTAMP", False, False, False),
        ("payment_method", "ENUM(UPI,Card...)", False, False, False),
        ("payment_status", "ENUM(Paid,Pend...)", False, False, False),
    ], header_color="#9333EA")

    # Connector lines and relationships
    def draw_rel_line(p1, p2, label1="1", label2="M", text=""):
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="-|>", color="#334155", lw=1.6, mutation_scale=14))
        # Midpoint label
        mx = (p1[0] + p2[0]) / 2
        my = (p1[1] + p2[1]) / 2
        if text:
            ax.text(mx, my + 1.2, text, fontsize=7.5, fontweight='bold',
                    ha='center', va='center', bbox=dict(boxstyle="square,pad=0.2", facecolor="#EFF6FF", edgecolor="#93C5FD", lw=0.8),
                    color="#1E3A8A")
        ax.text(p1[0] + (2 if p2[0] > p1[0] else -2), p1[1] + 1.5, label1, fontsize=8, fontweight='bold', color="#1E293B")
        ax.text(p2[0] - (2 if p2[0] > p1[0] else -2), p2[1] + 1.5, label2, fontsize=8, fontweight='bold', color="#1E293B")

    # Line 1: STUDENTS (42, 68) -> BOOKINGS (53, 58)
    draw_rel_line((42, 68), (53, 58), "1", "M", "places")

    # Line 2: SLOTS (42, 28) -> BOOKINGS (53, 40)
    draw_rel_line((42, 28), (53, 40), "1", "M", "reserves")

    # Line 3: BOOKINGS (87, 56) -> BOOKING_ITEMS (98, 64)
    draw_rel_line((87, 56), (98, 64), "1", "M", "contains")

    # Line 4: SERVICES (115, 40) -> BOOKING_ITEMS (115, 52)
    draw_rel_line((115, 40), (115, 52), "1", "M", "specified_in")

    # Line 5: BOOKINGS (70, 33) -> PAYMENTS (70, 24)
    draw_rel_line((70, 33), (70, 24), "1", "0..1", "settled_by")

    # Legend at bottom right
    ax.text(8, 2, "Legend: [PK] Primary Key  |  [FK] Foreign Key  |  [UQ] Unique Constraint  |  1:M One-to-Many Relationship",
            fontsize=8, fontstyle='italic', color="#64748B", fontfamily='serif')

    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"ER Diagram generated at: {output_path}")

if __name__ == "__main__":
    draw_er_diagram()
