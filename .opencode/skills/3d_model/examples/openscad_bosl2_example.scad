// Example: Mechanical Mounting Bracket with BOSL2 Fillets & Counter-sunk Holes
// Engine: OpenSCAD in Partwright Studio
// Run inside https://www.partwrightstudio.com/editor

include <BOSL2/std.scad>

$fn = 64;

module modern_bracket() {
    diff()
    cuboid([70, 45, 14], rounding=4, edges="Z") {
        // Recessed top mounting pocket
        attach(TOP)
        tag("remove")
        cuboid([56, 32, 6], rounding=2, edges="Z");

        // Mounting holes along corners
        attach(TOP)
        tag("remove") {
            grid_copies(spacing=[46, 24], n=[2, 2])
            cylinder(d=4.5, h=20, center=true);
        }
    }
}

modern_bracket();
